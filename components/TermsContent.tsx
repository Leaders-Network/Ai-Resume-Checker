import { BRAND, CONTACT_URL } from "@/lib/plans";
import { LEGAL_UPDATED } from "@/lib/legal";
const sections: [string, string[]][] = [
  ["The service", [
    `${BRAND} lets you set the skills, experience, location and certifications a role requires, upload applicant CVs as PDFs, and see how each CV matches those requirements, with scores, comparisons and reports depending on your plan.`,
    "Scores come from keyword matching and rule-based feedback. They are a first-pass aid, not an assessment of a person's ability, and we do not guarantee that they are complete or accurate.",
  ]],
  ["Your account", [
    "You must provide accurate details and keep your password secure. You are responsible for activity under your account. Do not share your account with people outside your organisation.",
    "You can delete your account at any time in Settings, under Security.",
  ]],
  ["Free trial, plans and payment", [
    "New accounts receive a 7-day free trial. No payment card is required to start.",
    "Paid plans are one-time purchases for a monthly or annual period. They do not renew automatically, so there is nothing to cancel. Each plan includes a monthly allowance of CV uploads; unused uploads do not roll over. Annual access lasts 12 calendar months, with the allowance refreshing each month.",
    "Prices are shown in naira on our pricing section. Payments are processed by Paystack. Except where the law requires otherwise, payments are non-refundable once a plan has been activated. If something went wrong with a payment, contact us and we will look into it.",
  ]],
  ["Applicant CVs and your responsibilities", [
    "You may upload only CVs that you are entitled to process, and you are responsible for having a lawful basis to do so, including informing applicants where the law requires it. You keep ownership of everything you upload. You give us permission to store and process it solely to provide the service to you, as described in our Privacy Policy.",
    "You are responsible for your hiring decisions. Do not rely on scores alone, and do not use the service in a way that unlawfully discriminates against applicants.",
  ]],
  ["Acceptable use", [
    "Do not upload unlawful content, malware or files that are not genuine PDFs. Do not attempt to access other users' data, overload or disrupt the service, reverse engineer it, or resell it without our written permission.",
    "We may suspend or end accounts that breach these terms.",
  ]],
  ["Our rights", [
    `${BRAND}, including its design, software and branding, belongs to us or our licensors. These terms give you a right to use the service, not ownership of it.`,
  ]],
  ["Availability and liability", [
    "We work to keep the service available, but it is provided as is, and we do not promise it will be uninterrupted or error free. To the extent the law allows, we are not liable for indirect or consequential losses, or for hiring outcomes, and our total liability for any claim is limited to the amount you paid us in the 12 months before it arose. Nothing in these terms limits liability that cannot lawfully be limited.",
  ]],
  ["Ending your use", [
    "You may stop using the service at any time. When you delete your account, your data is removed as described in our Privacy Policy. Sections that by their nature should continue, such as those on liability and our rights, continue after your account ends.",
  ]],
  ["Changes and governing law", [
    "If we change these terms in a meaningful way, we will ask you to review and accept them again before you continue. These terms are governed by the laws of the Federal Republic of Nigeria.",
  ]],
];
export default function TermsContent() {
  return <div className="space-y-6 text-sm leading-relaxed text-foreground">
    <p className="text-muted-foreground">Last updated {LEGAL_UPDATED}. By creating an account or using {BRAND}, you agree to these terms.</p>
    {sections.map(([heading, paragraphs]) => <section key={heading}>
      <h3 className="mb-2 text-base font-semibold">{heading}</h3>
      <div className="space-y-2">{paragraphs.map(text => <p key={text}>{text}</p>)}</div>
    </section>)}
    <section>
      <h3 className="mb-2 text-base font-semibold">Contact us</h3>
      <p>Questions about these terms? <a className="underline underline-offset-2" href={CONTACT_URL} target="_blank" rel="noopener noreferrer">Contact us on WhatsApp</a>.</p>
    </section>
  </div>;
}
