import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TRIAL_REASSURANCE } from "@/lib/plans";
export default function CTA() {
  return <section className="landing-cta"><div className="landing-container"><p className="section-label">Your next hire starts here</p><h2>Many CVs.<br />One clear shortlist.</h2><Link className="landing-button" href="/signup">Start screening for free <ArrowRight size={18} aria-hidden="true" /></Link><p className="reassurance">{TRIAL_REASSURANCE}</p></div></section>;
}
