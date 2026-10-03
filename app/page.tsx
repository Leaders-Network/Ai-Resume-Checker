import Navbar from "@/components/Navbar";
import Hero from "@/components/dashboard/Hero";
import UnfairAdvantage from "@/components/dashboard/UnfairAdvantage";
import StoryVideo from "@/components/dashboard/StoryVideo";
import Features from "@/components/dashboard/Features";
import Pricing from "@/components/dashboard/Pricing";
import Testimonial from "@/components/dashboard/Testimonial";
import FAQ from "@/components/dashboard/FAQ";
import CTA from "@/components/dashboard/CTA";
import Footer from "@/components/dashboard/Footer";
import "./landing.css";
export default function Page() {
  return <div className="landing"><a className="skip-link" href="#main-content">Skip to content</a><Navbar /><main id="main-content"><Hero /><UnfairAdvantage /><StoryVideo /><Features /><section className="landing-section landing-pricing" id="pricing"><div className="landing-container"><Pricing layout="split" /></div></section><Testimonial /><section className="landing-light landing-section" id="faq"><div className="landing-container"><FAQ variant="landing" /></div></section><CTA /></main><Footer /></div>;
}
