import Image from "next/image";
export default function Testimonial() {
  return <section className="testimonial" id="stories" aria-label="Why recruiters use it">
    <figure className="testimonial-photo"><Image src="/landing/testimonial-workspace.jpg" alt="A recruiter reviewing applicant CVs on a laptop" fill sizes="(min-width: 900px) 50vw, 100vw" /><figcaption><strong>50 CVs</strong><span>per month on Professional</span></figcaption></figure>
    <div className="testimonial-body"><span className="quote-mark" aria-hidden="true">“</span>
      <blockquote><p>Every applicant is held to the same criteria, so your shortlist reflects the role, not how much time you had to read.</p></blockquote>
      <p className="testimonial-author"><strong>Consistent screening</strong><span>Same requirements · every CV · every time</span></p></div>
  </section>;
}
