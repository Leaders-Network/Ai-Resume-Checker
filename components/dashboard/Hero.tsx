import Link from "next/link";
import { ArrowRight, Play, Target } from "lucide-react";
import { TRIAL_REASSURANCE } from "@/lib/plans";
import HeroGlobe from "@/components/dashboard/HeroGlobe";
export default function Hero() {
  return <section className="landing-hero"><div className="landing-container hero-grid">
    <div className="hero-copy"><p className="hero-eyebrow"><i aria-hidden="true" />CV SCREENING FOR RECRUITERS</p>
    <h1>Screen every CV. <em>Shortlist in minutes.</em></h1>
    <p className="hero-description">Set the skills, experience, location and certifications a role needs, upload your applicants&apos; CVs in bulk, and see who matches and who doesn&apos;t, ranked by score.</p>
    <div className="hero-actions"><Link className="landing-button" href="/signup">Start screening CVs <ArrowRight size={18} aria-hidden="true" /></Link><Link className="sample-link" href="#story"><span className="play-ring"><Play size={12} aria-hidden="true" /></span>See it in action</Link></div>
    <p className="reassurance">{TRIAL_REASSURANCE}</p></div>
    <div className="hero-visual" aria-hidden="false">
      <span className="orbit orbit-1" aria-hidden="true" /><span className="orbit orbit-2" aria-hidden="true" /><span className="orbit orbit-3" aria-hidden="true"><i className="orbit-dot" /></span>
      <div className="globe-wrap"><HeroGlobe /></div>
      <div className="float-card card-ats"><span className="card-icon"><Target size={18} aria-hidden="true" /></span><div><small>BULK UPLOAD</small><strong>Many CVs, one run</strong></div></div>
      <div className="float-card card-strength"><small>ROLE MATCH</small><strong>Scored<span>/100</span></strong><b className="bar"><i /></b></div>
      <div className="float-card card-insight"><span className="dot" aria-hidden="true" /><div><small>REQUIREMENTS</small><strong>Matched &amp; missing</strong></div></div>
      <i className="spark s1" aria-hidden="true" /><i className="spark s2" aria-hidden="true" /><i className="spark s3" aria-hidden="true" />
    </div>
  </div></section>;
}
