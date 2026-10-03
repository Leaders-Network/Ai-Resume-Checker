const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createHmac } = require("node:crypto");
const { load, fakeDatabase } = require("./helpers.cjs");
const plans = load("lib/plans.ts"), model = load("lib/subscription-model.ts");
const now = new Date("2026-01-31T10:15:00Z");
const unpaid = () => ({ subscription: { activePlan: "Free", resumeLimit: 3, subscriptionDate: null, expirationDate: null, isActive: false } });
const order = (uid = "u", interval = "annual") => ({ uid, planId: "basic", billingInterval: interval, amount: interval === "annual" ? 3360000 : 350000, email: "user@example.test", createdAt: now.toISOString() });
const verified = (reference, amount = 3360000) => ({ reference, amount, status: "success", currency: "NGN", customer: { email: "user@example.test" }, metadata: { uid: "u" } });
function paid() { const account = unpaid(); account.payments = { ref: order() }; return model.activatePayment(account, "ref", verified("ref"), now); }
beforeEach(() => { process.env.PAYSTACK_SECRET_KEY = "sk_test_fixture"; process.env.APP_URL = "https://example.test"; });
function service(database) {
  return load("lib/server/billing.ts", { "@/lib/firebase-admin": { getAdminDatabase: () => database, getAdminAuth: () => ({
    getUser: async uid => ({ uid, email: "user@example.test", metadata: { creationTime: now.toISOString() } }),
    verifyIdToken: async token => { if (token !== "good") throw Error("bad"); return { uid: "u" }; },
  }) } });
}
test("catalog amounts and validated signup continuation", () => {
  assert.deepEqual(plans.PLANS.map(p => plans.planPrice(p, "annual").total), [33600, 72000, 379200]);
  assert.deepEqual(plans.PLANS.map(p => plans.planPrice(p, "monthly").total), [3500, 7500, 39500]);
  assert.equal(plans.authDestination("?plan=pro&billing=annual"), "/dashboard/subscription?plan=pro&billing=annual");
  for (const search of ["?plan=enterprise&billing=annual", "?plan=pro&billing=bad", "?next=https://evil.test", "?plan=bad"]) assert.equal(plans.authDestination(search), "/dashboard");
});
test("UTC monthly anniversaries clamp without drifting and annual expiry clamps leap day", () => {
  assert.equal(model.addMonthsUTC(now.toISOString(), 1), "2026-02-28T10:15:00.000Z");
  assert.equal(model.addMonthsUTC(now.toISOString(), 2), "2026-03-31T10:15:00.000Z");
  assert.equal(model.addMonthsUTC("2024-02-29T10:15:00Z", 12), "2025-02-28T10:15:00.000Z");
});
test("annual credits refresh once, skip missed months and expire before refreshing", () => {
  const account = paid(); account.subscription.resumeLimit = 2;
  model.refreshAccount(account, new Date("2026-04-30T10:15:00Z"));
  assert.equal(account.subscription.resumeLimit, 10); assert.equal(account.subscription.creditPeriodEnd, "2026-05-31T10:15:00.000Z");
  account.subscription.resumeLimit = 4; model.refreshAccount(account, new Date("2026-04-30T12:15:00Z")); assert.equal(account.subscription.resumeLimit, 4);
  model.refreshAccount(account, new Date("2027-01-31T10:15:00Z")); assert.equal(account.subscription.isActive, false); assert.equal(account.subscription.resumeLimit, 0);
});
test("preserve legacy active balance; trial expiry grants existing basic fallback once", () => {
  const account = { subscription: { activePlan: "Basic", resumeLimit: 7, isActive: true, subscriptionDate: now.toISOString(), expirationDate: "2026-12-01T00:00:00Z" } };
  model.refreshAccount(account, new Date("2026-03-01")); assert.equal(account.subscription.resumeLimit, 7); assert.equal(account.subscription.monthlyAllowance, undefined);
  const trial = { subscription: model.initialTrial(now.toISOString(), now) };
  model.refreshAccount(trial, new Date("2026-02-07T10:15:00Z")); assert.equal(trial.subscription.resumeLimit, 3);
  trial.subscription.resumeLimit = 1; model.refreshAccount(trial, new Date("2026-02-08")); assert.equal(trial.subscription.resumeLimit, 1);
});
test("only successful uploads debit; failed/expired reservations release; excess batches reject", () => {
  const account = paid();
  model.reserveCredits(account, "batch", 8, now); assert.equal(account.subscription.resumeLimit, 10);
  assert.throws(() => model.reserveCredits(account, "extra", 3, now), /exceeds/);
  model.settleCredits(account, "batch", 3, now); assert.equal(account.subscription.resumeLimit, 7);
  model.reserveCredits(account, "failed", 7, now); model.settleCredits(account, "failed", 0, now); assert.equal(account.subscription.resumeLimit, 7);
  model.reserveCredits(account, "abandoned", 7, now); model.refreshAccount(account, new Date(now.getTime() + 16 * 60000)); assert.deepEqual(account.reservations, {});
  assert.throws(() => model.settleCredits(account, "abandoned", 1, now), /expired/);
});
test("duplicate callback/webhook cannot reactivate, extend term, or replenish spent credits", () => {
  const account = paid(), expiry = account.subscription.expirationDate;
  account.subscription.resumeLimit = 2;
  model.activatePayment(account, "ref", verified("ref"), new Date("2026-02-01"));
  assert.equal(account.subscription.resumeLimit, 2); assert.equal(account.subscription.expirationDate, expiry);
});
test("mismatched amount, status, currency, customer and ownership never activate", () => {
  for (const change of [{ amount: 1 }, { status: "failed" }, { currency: "USD" }, { customer: { email: "wrong@example.test" } }, { metadata: { uid: "other" } }, { reference: "wrong" }]) {
    const account = unpaid(); account.payments = { ref: order() };
    assert.throws(() => model.activatePayment(account, "ref", { ...verified("ref"), ...change }, now), /not been verified/);
    assert.equal(account.subscription.isActive, false);
  }
});
test("active paid access blocks replacement and flags delayed competing payments", () => {
  const account = paid(); account.payments.other = order();
  model.activatePayment(account, "other", verified("other"), now);
  assert.equal(account.payments.other.paidConflict, true); assert.equal(account.subscription.paymentReference, "ref");
});
test("atomic reservation transactions reject overspending across concurrent requests", async () => {
  const db = fakeDatabase({ billingAccounts: { u: { ...paid(), subscription: { ...paid().subscription, subscriptionDate: new Date().toISOString(), expirationDate: "2099-01-01", creditPeriodEnd: "2099-01-01" } } } }), billing = service(db);
  const outcomes = await Promise.allSettled(["a", "b", "c"].map(id => billing.changeAccount("u", (account, date) => model.reserveCredits(account, id, 6, date))));
  // Use an unexpired current fixture for this server-clock test.
  assert.equal(outcomes.filter(result => result.status === "fulfilled").length, 1);
});
test("authenticated reads migrate legacy subscription only once", async () => {
  const legacy = { activePlan: "Basic", isActive: true, resumeLimit: 8, subscriptionDate: "2026-01-01", expirationDate: "2099-01-01" };
  const db = fakeDatabase({ subscriptions: { u: legacy } }), billing = service(db);
  assert.equal((await billing.readSubscription("u")).resumeLimit, 8);
  db.data.subscriptions.u.resumeLimit = 999;
  assert.equal((await billing.readSubscription("u")).resumeLimit, 8);
});
test("missing/invalid auth is rejected before touching billing storage", async () => {
  const billing = service(fakeDatabase());
  await assert.rejects(billing.authenticatedUser(new Request("https://example.test")), /sign in/);
  await assert.rejects(billing.authenticatedUser(new Request("https://example.test", { headers: { Authorization: "Bearer bad" } })), /Invalid/);
  assert.equal((await billing.authenticatedUser(new Request("https://example.test", { headers: { Authorization: "Bearer good" } }))).uid, "u");
});
test("server initialization derives annual amount and reuses pending checkout", async () => {
  const db = fakeDatabase({ billingAccounts: { u: unpaid() } }), billing = service(db);
  const original = global.fetch; let calls = 0;
  global.fetch = async (url, options) => { calls++; const payload = JSON.parse(options.body); assert.equal(payload.amount, 3360000); assert.equal(payload.metadata.uid, "u"); assert.match(payload.callback_url, /billing=annual/); return Response.json({ status: true, data: { authorization_url: "https://checkout.paystack.com/test-fixture" } }); };
  try {
    const first = await billing.initializePayment("u", "basic", "annual"), second = await billing.initializePayment("u", "basic", "annual");
    assert.equal(first.reference, second.reference); assert.equal(calls, 1);
    await assert.rejects(billing.initializePayment("u", "pro", "monthly"), /pending checkout/);
    await assert.rejects(billing.initializePayment("u", "enterprise", "annual"), /valid plan/);
  } finally { global.fetch = original; }
});
test("verification ownership and duplicate delivery, including browser-closed completion", async () => {
  const reference = "lcv_12345678-1234-1234-1234-123456789abc", account = unpaid(); account.payments = { [reference]: order() };
  const db = fakeDatabase({ billingAccounts: { u: account }, paymentOwners: { [reference]: "u" } }), billing = service(db);
  const original = global.fetch;
  global.fetch = async () => Response.json({ status: true, data: verified(reference) });
  try {
    await assert.rejects(billing.verifyPayment(reference, "other"), /Unknown payment/);
    await billing.verifyPayment(reference); // Webhook can activate without a browser session.
    await billing.changeAccount("u", account => { account.subscription.resumeLimit = 2; return account; });
    assert.equal((await billing.verifyPayment(reference, "u")).resumeLimit, 2);
  } finally { global.fetch = original; }
});
test("signed webhook accepts only unmodified payloads", () => {
  const billing = service(fakeDatabase()), body = JSON.stringify({ event: "charge.success" }), secret = "fixture";
  const signature = createHmac("sha512", secret).update(body).digest("hex");
  assert.equal(billing.validWebhookSignature(body, signature, secret), true);
  assert.equal(billing.validWebhookSignature(body + " ", signature, secret), false);
  for (const invalid of [null, "", "xx", "0".repeat(128)]) assert.equal(billing.validWebhookSignature(body, invalid, secret), false);
});
test("payment routes reject unauthorized and malformed requests; webhook signature precedes verification", async () => {
  const billing = service(fakeDatabase());
  const mocks = { "@/lib/server/billing": billing };
  const init = load("app/api/payments/initialize/route.ts", mocks);
  assert.equal((await init.POST(new Request("https://example.test", { method: "POST", body: "{}" }))).status, 401);
  const response = await init.POST(new Request("https://example.test", { method: "POST", headers: { Authorization: "Bearer good" }, body: "{" }));
  assert.equal(response.status, 400);
  const webhook = load("app/api/payments/webhook/route.ts", mocks);
  assert.equal((await webhook.POST(new Request("https://example.test", { method: "POST", body: "{}" }))).status, 401);
});

test("uploads crossing a monthly anniversary do not spend the fresh month's credits", () => {
  const account = paid(), before = new Date("2026-02-28T10:14:00Z"), after = new Date("2026-02-28T10:16:00Z");
  model.reserveCredits(account, "previous-month", 10, before);
  model.refreshAccount(account, after);
  model.reserveCredits(account, "new-month", 10, after);
  model.settleCredits(account, "previous-month", 10, after);
  assert.equal(account.subscription.resumeLimit, 10);
  model.settleCredits(account, "new-month", 10, after);
  assert.equal(account.subscription.resumeLimit, 0);
});
test("in-flight trial uploads cannot consume a newly purchased paid allowance", () => {
  const account = { subscription: model.initialTrial(now.toISOString(), now), payments: { ref: order() } };
  model.reserveCredits(account, "trial-upload", 5, now);
  model.activatePayment(account, "ref", verified("ref"), now);
  model.settleCredits(account, "trial-upload", 5, now);
  assert.equal(account.subscription.resumeLimit, 10);
});
