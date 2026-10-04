const pillars = [
  ["Define the role", "Enter the skills, experience level, location and certifications the position requires.", "Criteria"],
  ["Upload the applicants", "Drop in as many applicant CVs as your plan allows. Each one is read and checked against your criteria.", "Bulk"],
  ["Compare and decide", "See each candidate's score, matched and missing requirements, and compare CVs side by side before you shortlist.", "Shortlist"],
];
export default function Features() {
  return <section className="landing-light landing-section" id="how-it-works"><div className="landing-container built-grid">
    <div className="section-intro"><p className="section-label">How it works</p><h2>From a pile of CVs to a shortlist.</h2><p>Leaders CV Checker gives recruiters a consistent, requirement-based first pass over every applicant.</p></div>
    <ol className="pillars">{pillars.map(([title, description, tag], index) => <li key={title}><span className="pillar-number">0{index + 1}</span><div><h3>{title}</h3><p>{description}</p></div><span className="pillar-tag">{tag}</span></li>)}</ol>
  </div></section>;
}
