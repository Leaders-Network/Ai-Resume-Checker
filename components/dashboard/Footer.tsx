import React from 'react';
import Link from 'next/link';
import { Github, Twitter,  Linkedin, Instagram,  } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();
  
  // Footer navigation categories
  const footerNavs = [
    {
      label: "Product",
      items: [
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/pricing" },
        { label: "Testimonials", href: "/#testimonials" },
        { label: "FAQ", href: "/faq" },
      ]
    },
    {
      label: "Resources",
      items: [
        { label: "Resume Templates", href: "/templates" },
        { label: "Career Blog", href: "/blog" },
        { label: "Job Search Tips", href: "/resources/job-search" },
        { label: "Interview Guides", href: "/resources/interviews" },
      ]
    },
    {
      label: "Company",
      items: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
        { label: "Privacy Policy", href: "/privacy" },
      ]
    }
  ];
  
  // Social media links
  const socialLinks = [
    { icon: Twitter, href: "https://twitter.com/resumeiq", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com/company/resumeiq", label: "LinkedIn" },
    { icon: Github, href: "https://github.com/resumeiq", label: "GitHub" },
    { icon: Instagram, href: "https://instagram.com/resumeiq", label: "Instagram" },
  ];
  
  return (
    <footer className="text-foreground">
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
        {/* Brand and company info */}
        <div className="lg:col-span-2">
          <div className="flex items-center mb-6">
            {/* Logo placeholder - replace with your actual logo */}
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mr-3">
              <span className="font-bold text-primary">IQ</span>
            </div>
            <span className="text-xl font-bold">ResumeIQ</span>
          </div>
          
          <p className="text-muted-foreground mb-6 max-w-md">
            Helping job seekers optimize their resumes with AI-powered analysis and personalized recommendations to land their dream jobs faster.
          </p>
          
          <div className="flex space-x-4 mb-6">
            {socialLinks.map((social) => (
              <a 
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-muted/70 hover:bg-muted transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
        
        {/* Navigation sections */}
        {footerNavs.map((section) => (
          <div key={section.label}>
            <h3 className="font-semibold mb-4">{section.label}</h3>
            <ul className="space-y-3">
              {section.items.map((item) => (
                <li key={item.label}>
                  <Link 
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      {/* Newsletter subscription */}
      <div className="border-t border-border pt-8 pb-6">
        <div className="grid md:grid-cols-3 gap-8 items-center mb-8">
          <div className="md:col-span-1">
            <h3 className="font-semibold mb-1">Stay updated</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to our newsletter for career tips and updates.
            </p>
          </div>
          <div className="md:col-span-2">
            <form className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="email-subscription" className="sr-only">Email address</label>
                <input
                  id="email-subscription"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="whitespace-nowrap rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/70"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        {/* Bottom copyright bar */}
        <div className="flex flex-col md:flex-row justify-between items-center border-t border-border pt-6 gap-4">
          <p className="text-sm text-muted-foreground order-2 md:order-1">
            © {currentYear} ResumeIQ. All rights reserved.
          </p>
          <div className="flex gap-6 order-1 md:order-2">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;