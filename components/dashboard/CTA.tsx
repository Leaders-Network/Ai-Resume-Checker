import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TRIAL_REASSURANCE } from "@/lib/plans";
export default function CTA() {
  return <section className="landing-cta"><div className="landing-container"><p className="section-label">Your next move starts here</p><h2>One resume.<br />Endless possibility.</h2><Link className="landing-button" href="/signup">Check my resume for free <ArrowRight size={18} aria-hidden="true" /></Link><p className="reassurance">{TRIAL_REASSURANCE}</p></div></section>;
}
