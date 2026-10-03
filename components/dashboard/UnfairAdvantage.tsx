import Link from "next/link";
import { ArrowRight, Lock, Sparkles, Upload } from "lucide-react";
const TICKER = ["ATS compatibility", "Impact writing", "Smart keywords", "Role matching", "Interview ready"];
export default function UnfairAdvantage() {
  return <>
    <ul className="ticker" aria-label="What we check">{TICKER.map(item => <li key={item}>{item}</li>)}</ul>
    <section className="advantage" id="scan"><div className="landing-container advantage-grid">
      <div className="advantage-copy"><p className="section-label">Your unfair advantage</p><h2>A better resume starts with the truth.</h2><p>No generic advice. No fluffy rewrites. Just clear signals about what recruiters notice, where they lose interest, and what to change next.</p>
        <div className="advantage-stat"><strong>4</strong><span>keyword categories checked: skills, experience, location and certifications</span></div></div>
      <div className="scan-card"><div className="scan-card-top"><p><Sparkles size={14} aria-hidden="true" /> Instant AI scan</p><span><Lock size={12} aria-hidden="true" /> Private</span></div>
        <h3>Drop in. Stand out.</h3><p className="scan-sub">Check your CV against the role you want in under a minute.</p>
        <Link className="dropzone" href="/signup"><span className="dropzone-icon"><Upload size={20} aria-hidden="true" /></span><span><strong>Drop your resume here</strong><small>PDF · max 10MB</small></span></Link>
        <Link className="scan-button" href="/signup">Reveal my resume score <ArrowRight size={18} aria-hidden="true" /></Link></div>
    </div></section>
  </>;
}
