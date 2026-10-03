import Link from "next/link";
import { ArrowRight, FileCheck2 } from "lucide-react";
import { BRAND } from "@/lib/plans";
import MobileNavigation from "@/components/MobileNavigation";
export default function Navbar() {
  return <header className="landing-header"><nav className="landing-container" aria-label="Main navigation">
    <Link className="brand" href="/" aria-label={`${BRAND} home`}><FileCheck2 aria-hidden="true" /><span>Leaders<span className="brand-detail">CV Checker</span></span></Link>
    <div className="desktop-links"><Link href="#how-it-works">How it works</Link><Link href="#pricing">Pricing</Link><Link href="#stories">Stories</Link><Link href="#faq">FAQ</Link></div>
    <div className="desktop-actions"><Link href="/signin">Sign in</Link><Link className="landing-button" href="/signup">Start free <ArrowRight size={14} aria-hidden="true" /></Link></div>
    <MobileNavigation />
  </nav></header>;
}
