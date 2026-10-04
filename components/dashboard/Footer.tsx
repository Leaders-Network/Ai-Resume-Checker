import Link from "next/link";
import { FileCheck2 } from "lucide-react";
import { BRAND, CONTACT_URL } from "@/lib/plans";
export default function Footer() {
  return <footer className="landing-footer"><div className="landing-container"><Link className="brand" href="/"><FileCheck2 aria-hidden="true" /><span>{BRAND}</span></Link><p className="footer-tagline">Sharper resumes. Brighter futures.</p><div className="footer-links"><Link href="/signin">Sign in</Link><Link href="/signup">Sign up</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy Policy</Link><a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">Contact on WhatsApp</a><span>© {new Date().getFullYear()} {BRAND}</span></div></div></footer>;
}
