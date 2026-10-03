import type { scoreCV } from "@/lib/scoring";
export function KeywordReport({ report }: { report: ReturnType<typeof scoreCV> }) {
  return <div className="keyword-report">
    <div className="report-score"><span>Overall keyword match</span><strong>{Math.round(report.score)}<span>%</span></strong><p>Keywords found in the CV against the selected job requirements.</p></div>
    <dl className="report-categories">{Object.entries(report.categoryScores).map(([label, score]) => <div key={label}><dt>{label === "certification" ? "Certifications" : label[0].toUpperCase() + label.slice(1)}</dt><dd>{Math.round(score)}%</dd><meter min={0} max={100} value={score} aria-label={`${label} keyword match`} /></div>)}</dl>
    <div className="report-keywords"><h3>Missing keywords</h3>{report.missing.length ? <ul>{report.missing.map((word, index) => <li key={`${word}-${index}`}>{word}</li>)}</ul> : <p>No missing keywords.</p>}<h3>Matched keywords</h3><p>{report.matches.join(", ") || "No matched keywords."}</p></div>
  </div>;
}
