import { PLANS, type BillingInterval, type PlanId } from "./plans";
export interface SubscriptionData {
  activePlan: string | null; resumeLimit: number; subscriptionDate: string | null; expirationDate: string | null; isActive: boolean;
  trialStartDate?: string | null; trialEndDate?: string | null; isTrialActive?: boolean; paymentReference?: string;
  planId?: PlanId; billingInterval?: BillingInterval; monthlyAllowance?: number; creditPeriodStart?: string; creditPeriodEnd?: string;
}
export interface PaymentOrder { uid: string; planId: "basic" | "pro"; billingInterval: BillingInterval; amount: number; email: string; createdAt: string; authorizationUrl?: string; activatedAt?: string; paidConflict?: boolean; }
export interface BillingAccount { subscription: SubscriptionData; payments?: Record<string, PaymentOrder>; reservations?: Record<string, { count: number; expiresAt: number; period?: string }>; pendingCheckout?: string | null; }
export class BillingError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function addMonthsUTC(iso: string, months: number) {
  const origin = new Date(iso), target = new Date(origin);
  target.setUTCDate(1); target.setUTCMonth(origin.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(origin.getUTCDate(), lastDay)); return target.toISOString();
}
export function initialTrial(createdAt: string, now: Date): SubscriptionData {
  const end = new Date(new Date(createdAt).getTime() + 7 * 86400000).toISOString(), active = now.getTime() < Date.parse(end);
  return { activePlan: active ? "Free Trial" : "Free", resumeLimit: active ? 999999 : 3, subscriptionDate: createdAt, expirationDate: end, isActive: active, isTrialActive: active, trialStartDate: createdAt, trialEndDate: end };
}
export function refreshAccount(account: BillingAccount, now: Date) {
  const s = account.subscription;
  for (const [id, hold] of Object.entries(account.reservations ?? {})) if (hold.expiresAt <= now.getTime()) delete account.reservations![id];
  if (s.isTrialActive && s.trialEndDate && Date.parse(s.trialEndDate) <= now.getTime()) Object.assign(s, { activePlan: "Free", resumeLimit: 3, isActive: false, isTrialActive: false });
  else if (s.isActive && !s.isTrialActive && s.expirationDate && Date.parse(s.expirationDate) <= now.getTime()) Object.assign(s, { isActive: false, resumeLimit: 0 });
  if (s.isActive && !s.isTrialActive && s.monthlyAllowance && s.subscriptionDate && s.creditPeriodEnd && Date.parse(s.creditPeriodEnd) <= now.getTime()) {
    let month = 0;
    while (Date.parse(addMonthsUTC(s.subscriptionDate, month + 1)) <= now.getTime()) month++;
    s.creditPeriodStart = addMonthsUTC(s.subscriptionDate, month); s.creditPeriodEnd = addMonthsUTC(s.subscriptionDate, month + 1); s.resumeLimit = s.monthlyAllowance;
  }
  return account;
}
export function hasPaidAccess(s: SubscriptionData, now: Date) { return s.isActive && !s.isTrialActive && (!s.expirationDate || Date.parse(s.expirationDate) > now.getTime()); }
function creditPeriod(s: SubscriptionData) {
  if (s.isTrialActive) return "trial:" + s.trialStartDate;
  if (s.isActive) return "paid:" + (s.paymentReference ?? "legacy") + ":" + (s.creditPeriodStart ?? s.subscriptionDate);
  return "free:" + (s.trialEndDate ?? s.subscriptionDate ?? "legacy");
}
export function reserveCredits(account: BillingAccount, id: string, count: number, now: Date) {
  refreshAccount(account, now);
  const period = creditPeriod(account.subscription);
  const held = Object.values(account.reservations ?? {}).filter(hold => (hold.period ?? period) === period).reduce((sum, hold) => sum + hold.count, 0);
  if (!Number.isInteger(count) || count < 1 || count > 50 || account.subscription.resumeLimit - held < count) throw new BillingError("This batch exceeds your remaining CV credits.", 409);
  account.reservations ??= {}; account.reservations[id] = { count, expiresAt: now.getTime() + 15 * 60 * 1000, period }; return account;
}
export function settleCredits(account: BillingAccount, id: string, successes: number, now: Date) {
  refreshAccount(account, now);
  const hold = account.reservations?.[id];
  if (!hold) throw new BillingError("Upload reservation expired. Please try again.", 409);
  if (!Number.isInteger(successes) || successes < 0 || successes > hold.count) throw new BillingError("Invalid upload count.");
  // Uploads reserved in an earlier allowance cannot spend a fresh allowance.
  if (!hold.period || hold.period === creditPeriod(account.subscription)) account.subscription.resumeLimit = Math.max(0, account.subscription.resumeLimit - successes);
  delete account.reservations![id]; return account;
}
export interface VerifiedPayment { status: string; currency: string; amount: number; reference: string; customer: { email: string }; metadata?: { uid?: string }; }
export function activatePayment(account: BillingAccount, reference: string, payment: VerifiedPayment, now: Date) {
  const order = account.payments?.[reference];
  if (!order) throw new BillingError("Unknown payment.", 404);
  if (payment.status !== "success" || payment.reference !== reference || payment.currency !== "NGN" || payment.amount !== order.amount || payment.customer?.email?.toLowerCase() !== order.email.toLowerCase() || payment.metadata?.uid !== order.uid) throw new BillingError("Payment has not been verified.", 409);
  if (order.activatedAt || order.paidConflict) return account;
  refreshAccount(account, now);
  if (hasPaidAccess(account.subscription, now)) { order.paidConflict = true; return account; }
  const plan = PLANS.find(plan => plan.id === order.planId)!, start = now.toISOString();
  account.subscription = { ...account.subscription, activePlan: plan.name, planId: plan.id, resumeLimit: plan.monthlyAllowance, monthlyAllowance: plan.monthlyAllowance, billingInterval: order.billingInterval, subscriptionDate: start, expirationDate: addMonthsUTC(start, order.billingInterval === "annual" ? 12 : 1), creditPeriodStart: start, creditPeriodEnd: addMonthsUTC(start, 1), isActive: true, isTrialActive: false, trialEndDate: null, paymentReference: reference };
  order.activatedAt = start; account.pendingCheckout = null; return account;
}
