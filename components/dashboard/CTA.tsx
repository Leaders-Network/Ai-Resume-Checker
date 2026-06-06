import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle, Upload, Zap } from 'lucide-react';

function CTA() {
  return (
    <div className="relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left: text */}
        <div className="max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-white/10 text-white/90 font-medium mb-6 border border-white/20 backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            Start analyzing in seconds
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5 leading-tight">
            Ready to optimize your resume?
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl leading-relaxed">
            Get started today and increase your chances of landing your dream job with our AI-powered resume analysis.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-gray-900 font-semibold shadow-xl hover:bg-white/90 transition-all hover:shadow-white/20 hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4 text-orange-500" />
              Try for free
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 text-white font-semibold border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all"
            >
              View pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Trust micro-badges */}
          <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
            {['No credit card required', 'Free 7-day trial', 'Cancel anytime'].map(t => (
              <div key={t} className="flex items-center gap-1.5 text-sm text-white/70">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Right: visual card */}
        <div className="hidden lg:block relative flex-shrink-0">
          {/* Glow */}
          <div className="absolute inset-0 bg-white/10 blur-2xl rounded-3xl" />
          <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-72 shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Upload className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Resume Analysis</div>
                <div className="text-xs text-white/60">AI-powered • Real-time</div>
              </div>
            </div>

            {/* Score indicator */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-white/70 mb-1.5">
                <span>Overall ATS Score</span>
                <span className="font-bold text-white">94/100</span>
              </div>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full"
                  style={{ width: '94%' }}
                />
              </div>
            </div>

            {/* Category bars */}
            {[
              { label: 'Keywords', pct: '87%', color: 'from-blue-400 to-cyan-300' },
              { label: 'Formatting', pct: '96%', color: 'from-violet-400 to-purple-300' },
              { label: 'Impact', pct: '79%', color: 'from-amber-400 to-yellow-300' },
            ].map(item => (
              <div key={item.label} className="mb-3">
                <div className="flex justify-between text-[11px] text-white/60 mb-1">
                  <span>{item.label}</span><span>{item.pct}</span>
                </div>
                <div className="h-1.5 w-full bg-white/20 rounded-full">
                  <div className={`h-full bg-gradient-to-r ${item.color} rounded-full`} style={{ width: item.pct }} />
                </div>
              </div>
            ))}

            {/* Bottom */}
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="text-xs text-white/60">3 improvements found</div>
              <div className="h-7 w-20 bg-white/20 rounded-lg flex items-center justify-center text-[11px] font-medium text-white">
                View All →
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CTA;