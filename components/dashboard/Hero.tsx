import Link from "next/link";
import { ArrowRight, Play, Target } from "lucide-react";
import { TRIAL_REASSURANCE } from "@/lib/plans";
import HeroGlobe from "@/components/dashboard/HeroGlobe";
export default function Hero() {
  return <section className="landing-hero"><div className="landing-container hero-grid">
    <div className="hero-copy"><p className="hero-eyebrow"><i aria-hidden="true" />CAREER INTELLIGENCE, SWITCHED ON</p>
    <h1>Don&apos;t just apply. <em>Arrive undeniable.</em></h1>
    <p className="hero-description">We turn your resume into a sharper story—built to beat the bots, impress the humans, and move your career forward.</p>
    <div className="hero-actions"><Link className="landing-button" href="/signup">Analyze my resume <ArrowRight size={18} aria-hidden="true" /></Link><Link className="sample-link" href="#story"><span className="play-ring"><Play size={12} aria-hidden="true" /></span>See it in action</Link></div>
    <p className="reassurance">{TRIAL_REASSURANCE}</p></div>
    <div className="hero-visual" aria-hidden="false">
      <span className="orbit orbit-1" aria-hidden="true" /><span className="orbit orbit-2" aria-hidden="true" /><span className="orbit orbit-3" aria-hidden="true"><i className="orbit-dot" /></span>
      <div className="globe-wrap"><HeroGlobe /></div>
      <div className="float-card card-ats"><span className="card-icon"><Target size={18} aria-hidden="true" /></span><div><small>ATS STATUS</small><strong>Ready to rank</strong></div></div>
      <div className="float-card card-strength"><small>RESUME STRENGTH</small><strong>92<span>/100</span></strong><b className="bar"><i /></b></div>
      <div className="float-card card-insight"><span className="dot" aria-hidden="true" /><div><small>LIVE INSIGHT</small><strong>3 impact wins found</strong></div></div>
      <i className="spark s1" aria-hidden="true" /><i className="spark s2" aria-hidden="true" /><i className="spark s3" aria-hidden="true" />
    </div>
  </div></section>;
}
