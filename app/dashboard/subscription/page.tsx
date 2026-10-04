"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/config/firebase";
import { getUserSubscription, type SubscriptionData } from "@/lib/auth";
import { billingRequest } from "@/lib/billing-client";
import { hasPaidAccess } from "@/lib/subscription-model";
import { selectionParams, type BillingInterval, type PlanId } from "@/lib/plans";
import Pricing from "@/components/dashboard/Pricing";
import FAQ from "@/components/dashboard/FAQ";
import "../../landing.css";

export default function SubscriptionPage() {
  const [user, authLoading] = useAuthState(auth);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [interval, setInterval] = useState<BillingInterval>("monthly"), [selectedPlan, setSelectedPlan] = useState(""), [selection, setSelection] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search), chosen = selectionParams(params);
    setSelection(chosen); setSelectedPlan(chosen ? params.get("plan")! : "");
    setInterval(chosen && params.get("billing") === "annual" ? "annual" : "monthly");
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setError("");
    const load = async () => {
      try {
        const reference = params.get("reference") || params.get("trxref");
        const data = reference ? (await billingRequest("/api/payments/verify", { reference })).subscription : await getUserSubscription(user.uid);
        if (cancelled) return;
        setSubscription(data);
        if (reference) { params.delete("reference"); params.delete("trxref"); window.history.replaceState(null, "", `/dashboard/subscription?${params}`); }
      } catch (error) { if (!cancelled) setError(error instanceof Error ? error.message : "Could not load your subscription."); }
      finally { if (!cancelled) setLoading(false); }
    };
    void load(); return () => { cancelled = true; };
  }, [user, authLoading, retry]);
  const checkout = async (planId: PlanId, billingInterval: BillingInterval) => {
    setBusy(true); setError("");
    try {
      const result = await billingRequest("/api/payments/initialize", { planId, billingInterval });
      window.location.assign(result.authorizationUrl);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not prepare checkout."); setBusy(false); }
  };
  const paid = subscription ? hasPaidAccess(subscription, new Date()) : false;
  return <div className="landing subscription-checkout"><div className="landing-container" style={{ paddingBlock: 40 }}>
    <Link href="/dashboard" className="sample-link">Back to dashboard</Link>
    <h1 style={{ fontSize: 32, marginBlock: "20px 28px" }}>Your CV screening plan</h1>
    {loading ? <p role="status">Loading your subscription…</p> : !user ? <p><Link href={`/signin${selection}`} className="landing-button">Sign in to choose a plan</Link></p> : <>
      {error && <div role="alert" style={{ padding: 20, border: "1px solid currentColor", marginBottom: 28 }}><p>{error}</p><button type="button" className="plan-button" onClick={() => setRetry(value => value + 1)}>Retry subscription check</button></div>}
      {subscription && <div style={{ marginBottom: 36, lineHeight: 1.8 }}><p>Current plan: <strong>{subscription.activePlan || "Free"}</strong></p><p>CV upload credits remaining: {subscription.resumeLimit === 999999 ? "Unlimited" : subscription.resumeLimit}</p>{subscription.expirationDate && <p>Access {subscription.isActive ? "expires" : "expired"}: {new Date(subscription.expirationDate).toLocaleDateString("en-NG")}</p>}{subscription.creditPeriodEnd && paid && <p>Next credit refresh: {new Date(subscription.creditPeriodEnd).toLocaleDateString("en-NG")}</p>}{paid && <p>New checkout is available after your current paid access expires.</p>}</div>}
      <Pricing initialInterval={interval} selectedPlan={selectedPlan} disabled={paid || !subscription || !!error} busy={busy} onCheckout={checkout} />
      <div style={{ marginTop: 64 }}><FAQ /></div>
    </>}
  </div></div>;
}
