'use client'

import Link from 'next/link';
import { FileText, Menu, X, Sparkles } from "lucide-react";
import { useEffect, useState } from 'react';

function Navbar() {
  const [userName, setUserName] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      setUserName(parsedUser.name || parsedUser.email);
    }
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <nav className={`flex items-center justify-between px-6 py-4 transition-all duration-300 ${
      scrolled ? 'shadow-md bg-background/95 backdrop-blur-md' : 'bg-transparent'
    }`}>
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="relative">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md group-hover:shadow-orange-400/30 transition-shadow">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div>
          <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">ResumeAI</span>
          <span className="hidden sm:block text-[9px] text-muted-foreground -mt-0.5 tracking-widest uppercase">Pro</span>
        </div>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Desktop CTA */}
      <div className="hidden md:flex items-center gap-3">
        {userName ? (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-orange-600">{userName[0].toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{userName}</span>
          </div>
        ) : (
          <>
            <Link
              href="/signin"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex text-white items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 shadow-md hover:shadow-orange-400/30 hover:from-orange-400 hover:to-orange-500 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Get Started Free
            </Link>
          </>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border shadow-lg md:hidden z-50 px-6 py-4 space-y-2">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-border pt-3 mt-2 space-y-2">
            <Link href="/signin" className="block px-4 py-2.5 text-sm font-medium text-center rounded-xl border border-border hover:bg-muted transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="block px-4 py-2.5 text-sm font-semibold text-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;