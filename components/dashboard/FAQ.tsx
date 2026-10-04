import { Plus } from "lucide-react";
import { CONTACT_URL } from "@/lib/plans";
export const FAQ_ITEMS = [
  ["Can I switch plans later?", "You can choose a new plan after your current paid access expires. Your existing plan stays active until then. For Enterprise enquiries, contact us on WhatsApp."],
  ["What happens to unused credits?", "Unused paid credits do not roll over. Basic includes 10 CV uploads and Professional includes 50 per month. On an annual plan, that allowance refreshes each monthly anniversary."],
  ["Is there a free trial for paid plans?", "New accounts receive a 7-day free trial. No payment card is required to start. Paid plans begin only when you choose a plan and complete checkout."],
];
export const LANDING_FAQ_ITEMS = [
  ["Will applicant CVs be stored?", "Uploaded PDFs are saved to your account so you can reopen them in the PDF viewer and compare them later. You can delete any CV from your history whenever you like."],
  ["Does it work with every industry?", "Yes. You enter the skills, experience, location and certifications the role requires, so the screening follows the position you are hiring for."],
  ["What does the checker actually check?", "It compares each applicant's CV text with the requirements you set and scores the match, showing what is matched and missing. Paid plans add feedback on content, such as action verbs and measurable achievements, and on formatting, such as bullet points, section headers and contact details."],
  ["Can I cancel a paid plan anytime?", "Paid plans are bought for the period you choose, monthly or annual, and do not renew automatically, so there is nothing to cancel. When your access expires you can choose a new plan."],
];
export default function FAQ({ variant }: { variant?: "landing" }) {
  const landing = variant === "landing", items = landing ? LANDING_FAQ_ITEMS : FAQ_ITEMS;
  return <div className={`faq-layout ${landing ? "faq-landing" : ""}`}>
    {landing
      ? <div className="section-intro"><p className="section-label">Questions, answered</p><h2>Everything you need. <em>Nothing hidden.</em></h2><p>Still curious? <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">Talk to a human.</a></p></div>
      : <div className="section-intro"><p className="section-label">FAQ</p><h2>Understand your plan before you start.</h2></div>}
    <div>{items.map(([question, answer], index) => <details key={question} open={landing && index === 0}><summary><span className="faq-number">0{index + 1}</span><h3>{question}</h3><Plus size={20} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></div>;
}
