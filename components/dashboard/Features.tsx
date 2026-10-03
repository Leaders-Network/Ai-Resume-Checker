const pillars = [
  ["Read the room", "We map your experience against what the role actually demands.", "Context"],
  ["Find the signal", "Our checker surfaces matched and missing keywords, content gaps, and strengths hidden in plain sight.", "Clarity"],
  ["Make the move", "You get a clear list of fixes to make before your next application, not a wall of vague recommendations.", "Momentum"],
];
export default function Features() {
  return <section className="landing-light landing-section" id="how-it-works"><div className="landing-container built-grid">
    <div className="section-intro"><p className="section-label">Built differently</p><h2>Not another resume grader.</h2><p>Leaders CV Checker sees the person behind the PDF and the opportunity in front of them.</p></div>
    <ol className="pillars">{pillars.map(([title, description, tag], index) => <li key={title}><span className="pillar-number">0{index + 1}</span><div><h3>{title}</h3><p>{description}</p></div><span className="pillar-tag">{tag}</span></li>)}</ol>
  </div></section>;
}
