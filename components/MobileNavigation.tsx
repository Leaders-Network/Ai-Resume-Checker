"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
export default function MobileNavigation() {
  const [open, setOpen] = useState(false), trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return <div className="mobile-nav">
    <button ref={trigger} type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-links" onClick={() => setOpen(!open)}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
    <div id="mobile-links" hidden={!open} className="mobile-links">
      {[["How it works", "#how-it-works"], ["Pricing", "#pricing"], ["Stories", "#stories"], ["FAQ", "#faq"], ["Sign in", "/signin"]].map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
      <Link className="landing-button" href="/signup" onClick={() => setOpen(false)}>Start free</Link>
    </div>
  </div>;
}
