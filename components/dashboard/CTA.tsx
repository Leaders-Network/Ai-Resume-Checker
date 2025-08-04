import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react'; // Assuming you're using Lucide icons

function CTA() {
  return (
    <div className="text-center sm:text-left sm:flex items-center justify-between">
      <div className="max-w-2xl">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Ready to optimize your resume?
        </h2>
        <p className="text-lg opacity-90 mb-6 sm:mb-8 max-w-xl">
          Get started today and increase your chances of landing your dream job with our AI-powered resume analysis.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-background text-foreground font-medium shadow-sm hover:bg-background/90 transition-colors"
          >
            Try for free
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
          >
            View pricing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
      
      <div className="hidden lg:block relative">
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-background/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-accent/20 rounded-full blur-lg"></div>
        <div className="relative bg-card p-6 rounded-2xl border border-border shadow-lg">
          <div className="w-64 h-48 flex flex-col justify-between">
            <div className="w-full h-2 bg-accent/30 rounded-full mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded-md"></div>
              <div className="h-4 w-1/2 bg-muted rounded-md"></div>
              <div className="h-4 w-5/6 bg-muted rounded-md"></div>
              <div className="h-4 w-2/3 bg-muted rounded-md"></div>
            </div>
            <div className="flex justify-end">
              <div className="h-8 w-24 bg-accent rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CTA;