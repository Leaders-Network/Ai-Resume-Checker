import { BRAND, CONTACT_URL } from "@/lib/plans";
import { LEGAL_UPDATED } from "@/lib/legal";
const sections: [string, string[]][] = [
  ["What we collect", [
    "Account details: your name, email address and, if you add one, a profile photo. If you sign in with Google, we receive the basic profile information Google shares with us.",
    "CVs you upload: the PDF files you upload for screening, and the keywords we detect in them (skills, experience level, location and certifications).",
    "Your screening criteria: the keywords you enter for a role, and your upload history.",
    "Billing details: your plan, billing period, credit balance and payment references. Card details are entered with our payment provider and are never stored by us.",
    "A record of your agreement: which version of our Terms and Privacy Policy you accepted, and when.",
  ]],
  ["Where your data is stored", [
    "Firebase Authentication holds your sign-in details (email, name and, for Google sign-in, your Google account identifier).",
    "Cloud Firestore holds your profile record, your upload history (file names, storage links and the keywords detected in each CV) and the record of your agreement to these documents.",
    "Firebase Realtime Database holds your plan, credit balance, billing period and payment references.",
    "Cloudinary stores the CV files and profile photo you upload.",
    "When you screen CVs, the text is read and scored in your browser. Your current keywords and results are kept temporarily in your browser session and are cleared when you close it.",
  ]],
  ["How we use it", [
    "To create and secure your account, and to run the screening you ask for: reading CV text, matching it against your criteria, scoring and comparing candidates.",
    "To manage your trial, plan, credits and payments.",
    "To keep the service working, prevent misuse and respond to your requests.",
    "We do not sell your data or the CVs you upload, and we do not use them for advertising.",
  ]],
  ["Applicant CVs and your responsibilities", [
    "CVs usually contain personal information about people other than you. When you upload an applicant's CV, you are responsible for having a lawful basis to do so and for using the results fairly. We process those CVs only on your behalf, to provide the service to you.",
    "Scores are a first-pass aid based on keyword matching. They should support, not replace, your own judgement in hiring decisions.",
  ]],
  ["Who we share it with", [
    "Service providers that run the product for us: Google Firebase (Authentication, Cloud Firestore and Realtime Database), Cloudinary (file storage) and Paystack (payment processing). They handle data only to provide those services.",
    "Authorities where the law requires it. We do not share your CVs with other users.",
  ]],
  ["How long we keep it, and deleting your account", [
    "Uploaded CVs stay in your account until you delete them from your upload history. Account and billing records are kept while your account is active.",
    "You can delete your account yourself at any time in Settings, under Security. This permanently removes your sign-in account, your Firestore profile and upload history, your uploaded CV files and profile photo, and your plan and credit balance. It cannot be undone.",
    "After deletion we keep only the payment references of past transactions, which we need for accounting and dispute handling. Copies may remain in our providers' backups for a limited period before they are overwritten. CV files uploaded before per-account storage was introduced may need to be removed by us on request; contact us below.",
  ]],
  ["Your rights", [
    "Under the Nigeria Data Protection Act 2023 and similar laws, you may ask to access, correct or delete your personal data, object to or restrict certain processing, and withdraw consent. You may also complain to the Nigeria Data Protection Commission.",
  ]],
  ["Security", [
    "We use access controls and encrypted connections to protect your data, but no online service is completely secure. Please keep your password safe.",
  ]],
  ["Changes to this policy", [
    "If we change this policy in a meaningful way, we will ask you to review and accept it again.",
  ]],
];
export default function PrivacyPolicyContent() {
  return <div className="space-y-6 text-sm leading-relaxed text-foreground">
    <p className="text-muted-foreground">Last updated {LEGAL_UPDATED}. This policy explains how {BRAND} handles personal data when you use our CV screening service.</p>
    {sections.map(([heading, paragraphs]) => <section key={heading}>
      <h3 className="mb-2 text-base font-semibold">{heading}</h3>
      <div className="space-y-2">{paragraphs.map(text => <p key={text}>{text}</p>)}</div>
    </section>)}
    <section>
      <h3 className="mb-2 text-base font-semibold">Contact us</h3>
      <p>Questions or requests about your data? <a className="underline underline-offset-2" href={CONTACT_URL} target="_blank" rel="noopener noreferrer">Contact us on WhatsApp</a>.</p>
    </section>
  </div>;
}
