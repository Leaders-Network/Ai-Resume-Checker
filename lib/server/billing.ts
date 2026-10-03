import { randomUUID, createHmac, timingSafeEqual } from "node:crypto";
import { getAdminAuth, getAdminDatabase } from "@/lib/firebase-admin";
import { PLANS, planPrice, type BillingInterval } from "@/lib/plans";
import { activatePayment, BillingError, hasPaidAccess, initialTrial, refreshAccount, type BillingAccount, type VerifiedPayment } from "@/lib/subscription-model";
import { NextResponse } from "next/server";
export async function authenticatedUser(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new BillingError("Please sign in.", 401);
  try { return await getAdminAuth().verifyIdToken(token); } catch { throw new BillingError("Invalid or expired sign-in.", 401); }
}
export function errorResponse(error: unknown) {
  if (error instanceof BillingError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("Billing operation failed:", error instanceof Error ? error.message : "Unknown error");
  return NextResponse.json({ error: "The service is unavailable. Please try again." }, { status: 503 });
}
export async function readJSON(request: Request) {
  try { return await request.json(); } catch { throw new BillingError("Invalid request body."); }
}
export async function ensureAccount(uid: string) {
  const database = getAdminDatabase(), accountRef = database.ref(`billingAccounts/${uid}`);
  if ((await accountRef.get()).exists()) return;
  const [legacy, user] = await Promise.all([database.ref(`subscriptions/${uid}`).get(), getAdminAuth().getUser(uid)]);
  const initial = legacy.exists() ? legacy.val() : initialTrial(new Date(user.metadata.creationTime).toISOString(), new Date());
  await accountRef.transaction(current => current ?? { subscription: initial });
}
export async function changeAccount(uid: string, change: (account: BillingAccount, now: Date) => BillingAccount) {
  await ensureAccount(uid);
  const now = new Date(); let failure: unknown;
  const result = await getAdminDatabase().ref(`billingAccounts/${uid}`).transaction(current => {
    if (!current) return current;
    try { failure = undefined; return change(current as BillingAccount, now); } catch (error) { failure = error; return; }
  });
  if (failure) throw failure;
  if (!result.committed) throw new BillingError("Please retry this operation.", 409);
  return result.snapshot.val() as BillingAccount;
}
export async function readSubscription(uid: string) { return (await changeAccount(uid, refreshAccount)).subscription; }
async function paystack(path: string, body?: object) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new BillingError("Checkout is not configured yet.", 503);
  const response = await fetch(`https://api.paystack.co/${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store", signal: AbortSignal.timeout(15000) });
  const result = await response.json();
  if (!response.ok || !result.status) throw new BillingError("Paystack could not complete the request. Please retry.", 502);
  return result.data;
}
export async function initializePayment(uid: string, planId: unknown, interval: unknown) {
  if ((planId !== "basic" && planId !== "pro") || (interval !== "monthly" && interval !== "annual")) throw new BillingError("Choose a valid plan and billing interval.");
  const origin = process.env.APP_URL;
  if (!origin || !process.env.PAYSTACK_SECRET_KEY) throw new BillingError("Checkout is not configured yet.", 503);
  const customer = await getAdminAuth().getUser(uid);
  if (!customer.email) throw new BillingError("An account email is required.");
  const plan = PLANS.find(plan => plan.id === planId)!, candidate = `lcv_${randomUUID()}`;
  const account = await changeAccount(uid, (account, now) => {
    refreshAccount(account, now);
    if (hasPaidAccess(account.subscription, now)) throw new BillingError("New checkout is available after your paid access expires.", 409);
    if (account.pendingCheckout) {
      const pending = account.payments?.[account.pendingCheckout];
      if (pending && Date.parse(pending.createdAt) + 3600000 > now.getTime()) {
        if (pending.planId !== planId || pending.billingInterval !== interval) throw new BillingError("Finish your pending checkout or try another selection after one hour.", 409);
        return account;
      }
    }
    account.payments ??= {};
    account.payments[candidate] = { uid, planId, billingInterval: interval as BillingInterval, amount: planPrice(plan, interval).total * 100, email: customer.email!, createdAt: now.toISOString() };
    account.pendingCheckout = candidate; return account;
  });
  const reference = account.pendingCheckout!, order = account.payments![reference];
  if (order.authorizationUrl) return { authorizationUrl: order.authorizationUrl, reference };
  if (reference !== candidate) throw new BillingError("Checkout is being prepared. Please try again.", 409);
  await getAdminDatabase().ref(`paymentOwners/${reference}`).set(uid);
  try {
    const data = await paystack("transaction/initialize", { email: order.email, amount: order.amount, currency: "NGN", reference, callback_url: `${new URL("/dashboard/subscription", origin).href}?plan=${planId}&billing=${interval}`, metadata: { uid, planId, billingInterval: interval } });
    const checkout = new URL(data.authorization_url);
    if (checkout.protocol !== "https:" || checkout.hostname !== "checkout.paystack.com") throw new BillingError("Invalid checkout destination.", 502);
    await changeAccount(uid, account => { account.payments![reference].authorizationUrl = checkout.href; return account; });
    return { authorizationUrl: checkout.href, reference };
  } catch (error) {
    await changeAccount(uid, account => { if (account.pendingCheckout === reference) account.pendingCheckout = null; return account; }); throw error;
  }
}
export async function verifyPayment(reference: unknown, uid?: string) {
  if (typeof reference !== "string" || !/^lcv_[a-f0-9-]{36}$/.test(reference)) throw new BillingError("Invalid payment reference.");
  const owner = (await getAdminDatabase().ref(`paymentOwners/${reference}`).get()).val();
  if (typeof owner !== "string" || (uid && uid !== owner)) throw new BillingError("Unknown payment.", 404);
  const payment = await paystack(`transaction/verify/${encodeURIComponent(reference)}`) as VerifiedPayment;
  const account = await changeAccount(owner, (account, now) => activatePayment(account, reference, payment, now));
  if (account.payments![reference].paidConflict) {
    console.error("Payment requires manual resolution:", reference);
    if (uid) throw new BillingError("Payment received while another paid term is active. Contact support with your payment reference.", 409);
  }
  return account.subscription;
}
export function validWebhookSignature(body: string, signature: string | null, secret: string) {
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  return timingSafeEqual(createHmac("sha512", secret).update(body).digest(), Buffer.from(signature, "hex"));
}
