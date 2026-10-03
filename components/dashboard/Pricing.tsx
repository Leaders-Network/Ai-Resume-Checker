"use client";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { CONTACT_URL, PLANS, formatNaira, planPrice, type BillingInterval, type PlanId } from "@/lib/plans";
interface Props { layout?: "split"; initialInterval?: BillingInterval; selectedPlan?: string; disabled?: boolean; busy?: boolean; onCheckout?: (plan: PlanId, interval: BillingInterval) => void; }
export default function Pricing({ layout, initialInterval = "monthly", selectedPlan, disabled, busy, onCheckout }: Props) {
  const [interval, setInterval] = useState<BillingInterval>(initialInterval), controlId = useId();
  useEffect(() => { setInterval(initialInterval); }, [initialInterval]);
  const split = layout === "split";
  return <div className={`pricing-content ${split ? "pricing-split" : ""}`}>
    <div className="pricing-heading"><div>{split
      ? <><p className="section-label">Choose your momentum</p><h2>Pay for progress, not empty promises.</h2><p>Start with a 7-day free trial, no card needed. Upgrade when the opportunity feels right. Pay securely in naira through Paystack.</p></>
      : <><p className="section-label">Plans in naira</p><h2>Choose how many CVs you need to check.</h2><p>Pay securely through Paystack. Annual billing saves 20%.</p></>}</div>
    <fieldset className="billing-options"><legend className="sr-only">Billing interval</legend>{(["monthly", "annual"] as const).map(value => <label key={value}><input type="radio" name={controlId} value={value} checked={interval === value} onChange={() => setInterval(value)} /><span>{value === "monthly" ? "Monthly" : "Annual · save 20%"}</span></label>)}</fieldset></div>
    <div className="pricing-plans">{PLANS.map(plan => {
      const price = planPrice(plan, interval), professional = plan.id === "pro", features = split && !professional ? plan.features.slice(0, 1) : plan.features;
      return <article className={`plan-panel ${professional ? "plan-professional" : ""} ${selectedPlan === plan.id ? "plan-selected" : ""}`} key={plan.id}>
        <div className="plan-heading"><span className="plan-index">{professional ? "For regular applications" : plan.id === "basic" ? "For individual applications" : "For teams"}</span><h3>{plan.name}</h3><p>{plan.description}</p></div>
        <div className="plan-price"><p><strong>{formatNaira(price.equivalentMonthly)}</strong><span> / month</span></p><p className="billing-total">{interval === "annual" ? `${formatNaira(price.total)} billed annually` : `${formatNaira(price.total)} billed monthly`}</p></div>
        <div className="plan-divider" aria-hidden="true" />
        <ul>{features.map(feature => <li key={feature}><Check size={16} aria-hidden="true" /><span>{feature}</span></li>)}</ul>
        {plan.id === "enterprise" ? <a className="plan-button" href={CONTACT_URL} target="_blank" rel="noopener noreferrer">Enquire on WhatsApp <ArrowRight size={18} aria-hidden="true" /></a> : onCheckout ? <button type="button" className="plan-button" disabled={disabled || busy} onClick={() => onCheckout(plan.id, interval)}>{busy ? "Preparing checkout…" : disabled ? "Available after expiry" : `Choose ${plan.name}`}<ArrowRight size={18} aria-hidden="true" /></button> : <Link className="plan-button" href={`/signup?plan=${plan.id}&billing=${interval}`}>Choose {plan.name}<ArrowRight size={18} aria-hidden="true" /></Link>}
      </article>;
    })}</div><p className="pricing-note">Annual plans are paid once for 12 months. Monthly CV credits refresh without rollover. Enterprise arrangements are discussed on WhatsApp.</p>
  </div>;
}
