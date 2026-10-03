import Image from "next/image";
export default function Testimonial() {
  return <section className="testimonial" id="stories" aria-label="Customer story">
    <figure className="testimonial-photo"><Image src="/landing/testimonial-workspace.jpg" alt="A job seeker reviewing their resume on a laptop" fill sizes="(min-width: 900px) 50vw, 100vw" /><figcaption><strong>84 → 97</strong><span>resume score</span></figcaption></figure>
    <div className="testimonial-body"><span className="quote-mark" aria-hidden="true">“</span>
      <blockquote><p>I stopped trying to sound impressive and finally sounded like myself—just clearer, stronger, and impossible to overlook.</p></blockquote>
      <p className="testimonial-author"><strong>Maya Chen</strong><span>Product designer · Hired in 3 weeks</span></p></div>
  </section>;
}
