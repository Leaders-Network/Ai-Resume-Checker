# Billing configuration and rollout

This change uses one-time Paystack transactions, not automatically renewing subscriptions. Basic costs ₦3,500/month or ₦33,600/year; Professional ₦7,500/month or ₦72,000/year. Enterprise enquiries go to the existing WhatsApp destination, with quoted catalog rates ₦39,500/month or ₦379,200/year.

## Required server environment

- `PAYSTACK_SECRET_KEY`: start with a Paystack test secret. Never use a NEXT_PUBLIC variable for it.
- `APP_URL`: the application's trusted absolute origin; use HTTPS in production. Callback URLs are derived from this value, never from request headers.
- Existing `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, and `NEXT_PUBLIC_FIREBASE_DATABASE_URL`: the Admin credential needs access to the project's Realtime Database and Firestore.
- Existing Cloudinary credentials for authenticated PDF uploads.

No credentials are committed. Missing checkout configuration produces a recoverable service error. The hosted checkout flow no longer needs the browser Paystack script or public key.

Set the Paystack webhook URL to `APP_URL/api/payments/webhook`. Configure the test URL before exercising test checkout. Only signed charge.success events with this application's lcv_ reference prefix are handled. Every payment is verified with Paystack's server API before activation. Callback and webhook share an atomic activation transaction; closing the browser does not prevent webhook activation.

## Firebase rules and compatibility

Review and deploy `firebase.database.rules.json` with the application release. It denies client writes to legacy subscriptions, billingAccounts, and paymentOwners. Merge unrelated application namespaces into this rules file as needed. Remove any permissive ancestor .write/.read grants: a child denial cannot override a parent grant. Do not publish the new checkout while old permissive billing rules remain active.

Authoritative account state is stored under billingAccounts/UID: subscription, payment orders, upload reservations, and pending checkout. paymentOwners/reference is a server-only lookup. On first server access, an existing subscriptions/UID record is copied once without changing its balance or paid expiry; that legacy record thereafter remains an archive. Clients obtain current data from GET /api/subscription rather than writing balances directly. New trial dates come from Firebase Auth account creation time, so profile edits cannot restart a trial.

Existing paid accounts keep their balances and expiration dates. New verified purchases gain interval, allowance and credit-period fields. All paid access expires on the server. New monthly purchases last one calendar month; annual purchases last 12 calendar months. Monthly anniversary dates use UTC and clamp to the target month's final day without drifting from the original anniversary. Missed months do not accumulate allowances. Trial expiry preserves the existing three-credit basic fallback; it is not advertised as a recurring free plan.

## Payments and credits

- Active paid customers cannot start new checkout until expiry. Trial users may purchase. No proration, early replacement, automatic renewal, or automatic payment initiation.
- A pending checkout is reused for the same plan and interval for one hour; other selections receive a clear conflict message during that time.
- A late successful payment from an older checkout, after another paid term has activated, is recorded as paidConflict. It never overwrites active access. Resolve/refund it manually in Paystack using its reference; the callback shows a support message and server logs identify the reference.
- CV credits are used for successful PDF uploads, matching the existing product's charging point. Rechecking uploaded CVs does not spend another upload credit.
- Batches support up to 50 PDFs, each up to 10 MB, with a 50 MB total limit. The entire requested count is reserved atomically before storage starts. Only successful files debit credits; failed files release their reservation. Reservations belong to the allowance under which they started, so uploads crossing an anniversary or a trial-to-paid purchase cannot spend newly granted credits. Concurrent requests cannot exceed the allowance.
- Reservations expire after 15 minutes to recover from abandoned requests. A late completion without a valid reservation cleans up uploaded assets. For infrastructure crashes after storage but before settlement, monitor Cloudinary's user-scoped resume folders for orphaned assets.
- Keep the webhook secret and payment records server-only. Server logs should be monitored for failed operations and paidConflict references.

## Before production

Run npm test, npm run lint, npm run typecheck, and npm run build. With test credentials, check both plans and intervals, callback completion, browser-closed webhook completion, retries, cancelled checkout, paid-expiry blocking, and concurrent PDF uploads against a test Firebase project. Confirm rules with Firebase Emulator or a test project before deploying. No live accounts or settings were changed by this implementation.

New CV storage assets use resumes/UID folders, so deletion can verify ownership independently of client-authored history. Legacy unscoped Cloudinary files require administrator removal; the dashboard can still remove their history entry. Do not infer ownership from a user-writable publicId field.
