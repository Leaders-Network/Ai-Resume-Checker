import Link from "next/link";
import { ArrowRight, Lock, Sparkles, Upload } from "lucide-react";
const TICKER = ["Bulk CV upload", "Keyword matching", "Match scores", "CV comparison", "Exportable reports"];
export default function UnfairAdvantage() {
  return <>
    <ul className="ticker" aria-label="What we check">{TICKER.map(item => <li key={item}>{item}</li>)}</ul>
    <section className="advantage" id="scan"><div className="landing-container advantage-grid">
      <div className="advantage-copy"><p className="section-label">Built for hiring teams</p><h2>Stop reading every CV line by line.</h2><p>Define what the role demands once. Every CV you upload is checked against it, so you can see who meets the requirements, what each candidate is missing, and who deserves your time first.</p>
        <div className="advantage-stat"><strong>4</strong><span>requirement categories you set per role: skills, experience, location and certifications</span></div></div>
      <div className="scan-card"><div className="scan-card-top"><p><Sparkles size={14} aria-hidden="true" /> Instant AI scan</p><span><Lock size={12} aria-hidden="true" /> Private</span></div>
        <h3>Drop in a stack of CVs.</h3><p className="scan-sub">Upload multiple applicant CVs and score them against your role requirements in one go.</p>
        <Link className="dropzone" href="/signup"><span className="dropzone-icon"><Upload size={20} aria-hidden="true" /></span><span><strong>Drop applicant CVs here</strong><small>PDF · max 10MB each · multiple files</small></span></Link>
        <Link className="scan-button" href="/signup">Score my applicants <ArrowRight size={18} aria-hidden="true" /></Link></div>
    </div></section>
  </>;
}
