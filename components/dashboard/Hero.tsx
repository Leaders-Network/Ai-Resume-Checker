'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight, Upload, CheckCircle, Star, Sparkles, TrendingUp, Shield } from 'lucide-react';

const floatingCards = [
  { icon: CheckCircle, label: 'ATS Score', value: '94/100', color: 'text-emerald-500', bg: 'bg-emerald-500/10', delay: '0s' },
  { icon: TrendingUp, label: 'Match Rate', value: '+3.2×', color: 'text-blue-500', bg: 'bg-blue-500/10', delay: '0.3s' },
  { icon: Shield, label: 'ATS Friendly', value: 'Verified ✓', color: 'text-violet-500', bg: 'bg-violet-500/10', delay: '0.6s' },
];

function Hero() {
  return (
    <div className="relative overflow-hidden pt-8 pb-20 lg:pt-16 lg:pb-28">
      {/* Rich gradient orbs */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-orange-500/20 via-primary/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-32 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-violet-500/15 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-blue-500/5 to-transparent blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: Text ── */}
          <div className="max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium mb-6 border border-orange-500/20">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Trusted by 20,000+ professionals
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
              Optimize your resume with{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-orange-500 via-primary to-violet-500 bg-clip-text text-transparent">
                  AI-powered
                </span>
                <svg className="absolute -bottom-1 left-0 w-full" height="4" viewBox="0 0 200 4" preserveAspectRatio="none">
                  <path d="M0,2 Q50,0 100,2 T200,2" stroke="url(#grad)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>{' '}
              analysis
            </h1>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Get personalized feedback, beat applicant tracking systems, and land more interviews with our intelligent resume checker.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link
                href="/signin"
                className="inline-flex text-black items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:from-orange-400 hover:to-orange-500 transition-all duration-300 btn-shimmer"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-border bg-background/60 backdrop-blur-sm font-medium hover:bg-muted transition-all"
              >
                <Upload className="h-4 w-4 text-primary" />
                Upload Resume
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[
                    ['#f97316', '#ea580c'],
                    ['#8b5cf6', '#7c3aed'],
                    ['#06b6d4', '#0891b2'],
                    ['#10b981', '#059669'],
                  ].map(([from, to], i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full ring-2 ring-background flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: `linear-gradient(135deg, ${from}, ${to})`, zIndex: 4 - i }}
                    >
                      {['A', 'S', 'M', 'E'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current text-amber-400" />
                    ))}
                    <span className="ml-1.5 text-sm font-semibold">4.9</span>
                  </div>
                  <div className="text-xs text-muted-foreground">from 2,000+ reviews</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                Free plan available — no credit card
              </div>
            </div>
          </div>

          {/* ── Right: App Mockup ── */}
          <div className="relative lg:ml-auto mt-10 lg:mt-0 max-w-lg lg:max-w-none mx-auto lg:mx-0">
            {/* Main card */}
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl">
              <div className="bg-card">
                {/* Fake browser bar */}
                <div className="bg-muted/80 px-4 py-3 flex items-center gap-3 border-b border-border">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 h-6 rounded-md bg-background/60 flex items-center px-3">
                    <span className="text-xs text-muted-foreground">app.resumeai.io/dashboard</span>
                  </div>
                </div>

                {/* App content */}
                <div className="bg-background p-5">
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="space-y-1.5">
                      <div className="h-5 w-40 bg-gradient-to-r from-muted to-muted/50 rounded-md" />
                      <div className="h-3.5 w-28 bg-muted/40 rounded-md" />
                    </div>
                    <div className="h-9 w-28 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-medium gap-1.5">
                      <Upload className="h-3.5 w-3.5" /> Upload
                    </div>
                  </div>

                  {/* Score + content grid */}
                  <div className="grid grid-cols-5 gap-4 mb-5">
                    {/* Left: resume preview */}
                    <div className="col-span-3 space-y-3">
                      {[{ w: 'w-3/4', h: 'h-4' }, { w: 'w-full', h: 'h-3' }, { w: 'w-4/5', h: 'h-3' }, { w: 'w-full', h: 'h-16' }, { w: 'w-2/3', h: 'h-3' }].map((bar, i) => (
                        <div key={i} className={`${bar.h} ${bar.w} bg-muted/70 rounded`} />
                      ))}
                    </div>
                    {/* Right: score panel */}
                    <div className="col-span-2 bg-card rounded-xl border border-border p-3.5 space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-extrabold text-foreground">92</div>
                        <div className="text-xs text-muted-foreground">ATS Score</div>
                        <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: '92%' }} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: 'Keywords', pct: '85%', color: 'from-blue-500 to-blue-400' },
                          { label: 'Format', pct: '96%', color: 'from-violet-500 to-violet-400' },
                          { label: 'Impact', pct: '78%', color: 'from-orange-500 to-orange-400' },
                        ].map(item => (
                          <div key={item.label}>
                            <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                              <span>{item.label}</span><span>{item.pct}</span>
                            </div>
                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                              <div className={`h-full bg-gradient-to-r ${item.color} rounded-full`} style={{ width: item.pct }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom action row */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-600">AT</div>
                      <div className="space-y-1">
                        <div className="h-3 w-20 bg-muted rounded" />
                        <div className="h-2.5 w-14 bg-muted/50 rounded" />
                      </div>
                    </div>
                    <div className="h-8 w-24 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating stat cards */}
            {floatingCards.map((card, i) => (
              <div
                key={i}
                className={`hidden lg:flex absolute items-center gap-2.5 ${card.bg} border border-white/10 backdrop-blur-sm px-3.5 py-2.5 rounded-xl shadow-xl animate-float`}
                style={{
                  top: i === 0 ? '-1rem' : i === 1 ? '40%' : 'auto',
                  bottom: i === 2 ? '-1rem' : 'auto',
                  right: i === 1 ? '-2rem' : 'auto',
                  left: i === 0 ? '-2rem' : i === 2 ? '-1.5rem' : 'auto',
                  animationDelay: card.delay,
                }}
              >
                <card.icon className={`h-4 w-4 ${card.color}`} />
                <div>
                  <div className="text-xs font-bold text-foreground">{card.value}</div>
                  <div className="text-[10px] text-muted-foreground">{card.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;