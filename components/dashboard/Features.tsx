import React from 'react';
import {
  FileSearch,
  AlignLeft,
  Sparkles,
  LineChart,
  Layers,
  CheckCircle,
  ArrowRight,
  Zap,
  Target,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    title: "AI-Powered Resume Analysis",
    description: "Advanced algorithms analyze your resume against job descriptions to identify strengths and improvement areas.",
    icon: Sparkles,
    accent: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-500/10',
    color: 'text-orange-500',
  },
  {
    title: "ATS Compatibility Check",
    description: "Ensure your resume passes through Applicant Tracking Systems with format and keyword optimization.",
    icon: FileSearch,
    accent: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
    color: 'text-blue-500',
  },
  {
    title: "Content Quality Scoring",
    description: "Receive detailed feedback on the quality, impact, and relevance of your resume content.",
    icon: AlignLeft,
    accent: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-500/10',
    color: 'text-violet-500',
  },
  {
    title: "Industry Benchmarking",
    description: "Compare your resume against industry standards and top-performing candidates.",
    icon: LineChart,
    accent: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10',
    color: 'text-emerald-500',
  },
];

const detailedFeatures = [
  {
    title: "Smart Keyword Detection",
    description: "Our system identifies missing keywords and phrases that are crucial for your target positions, helping you optimize your resume for specific job descriptions.",
    icon: Layers,
  },
  {
    title: "Achievement Impact Analysis",
    description: "Get feedback on how effectively your achievements demonstrate impact, with suggestions to strengthen your accomplishment statements.",
    icon: CheckCircle,
  }
];

const stats = [
  { value: "93%", label: "Improved interview rate", icon: Target, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { value: "2.5×", label: "Faster job search", icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { value: "20K+", label: "Resumes optimized", icon: FileSearch, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { value: "98%", label: "Customer satisfaction", icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

function Features() {
  return (
    <div className="space-y-28" id="features">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-primary/10 text-primary font-medium mb-5 border border-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          Powerful Features
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
          Everything you need to create an{' '}
          <span className="bg-gradient-to-r from-orange-500 to-violet-500 bg-clip-text text-transparent">
            exceptional resume
          </span>
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Our AI-powered platform provides comprehensive analysis and tailored recommendations
          to help you build a resume that stands out to employers and beats applicant tracking systems.
        </p>
      </div>

      {/* Feature cards grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="relative group overflow-hidden rounded-2xl border border-border p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card"
          >
            {/* Gradient accent top strip */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />

            {/* Orb decorator */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent group-hover:scale-150 transition-transform duration-700" />

            {/* Icon */}
            <div className={`mb-4 p-3 rounded-xl ${feature.bg} inline-flex`}>
              <feature.icon className={`h-6 w-6 ${feature.color}`} />
            </div>

            <div className="relative">
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feature spotlight */}
      <div className="grid lg:grid-cols-2 gap-14 items-center">
        {/* Mockup panel */}
        <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl bg-card p-1">
          <div className="bg-background rounded-xl overflow-hidden aspect-[4/3] relative">
            <div className="absolute inset-0 flex flex-col p-5">
              <div className="flex justify-between items-center mb-5">
                <div className="h-6 w-32 bg-muted rounded-lg" />
                <div className="flex gap-2">
                  <div className="h-7 w-7 bg-primary/20 rounded-lg" />
                  <div className="h-7 w-7 bg-muted rounded-lg" />
                </div>
              </div>

              <div className="flex-1 flex gap-4">
                {/* Left resume preview */}
                <div className="w-1/2 p-3 bg-muted/20 rounded-xl border border-border space-y-2">
                  {[{ w: 'w-3/4', h: 'h-4' }, { w: 'w-full', h: 'h-3' }, { w: 'w-full', h: 'h-3' }, { w: 'w-4/5', h: 'h-3' }].map((b, i) => (
                    <div key={i} className={`${b.h} ${b.w} bg-muted rounded`} />
                  ))}
                  <div className="pt-2 space-y-1.5">
                    <div className="h-3 w-1/2 bg-muted rounded" />
                    <div className="h-3 w-full bg-muted/70 rounded" />
                    <div className="h-3 w-full bg-muted/70 rounded" />
                  </div>
                </div>

                {/* Right analysis panel */}
                <div className="w-1/2 p-3 bg-primary/5 rounded-xl border border-primary/10 space-y-3">
                  <div className="text-xs font-semibold text-primary mb-2">AI Analysis</div>
                  {[
                    { label: 'Keywords', pct: '78%', color: 'bg-blue-500' },
                    { label: 'ATS Match', pct: '92%', color: 'bg-emerald-500' },
                    { label: 'Impact', pct: '65%', color: 'bg-amber-500' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{item.label}</span><span>{item.pct}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: item.pct }} />
                      </div>
                    </div>
                  ))}

                  <div className="pt-1 space-y-2">
                    {[true, true, false].map((ok, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        {ok
                          ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          : <div className="h-3.5 w-3.5 rounded-full border-2 border-red-400 flex-shrink-0 mt-0.5" />}
                        <div className="h-2.5 flex-1 bg-muted/60 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right text */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-primary/10 text-primary font-medium border border-primary/20">
            Real-time analysis
          </div>

          <h3 className="text-2xl md:text-3xl font-bold leading-tight">
            Get instant feedback as you{' '}
            <span className="bg-gradient-to-r from-orange-500 to-primary bg-clip-text text-transparent">
              build your resume
            </span>
          </h3>

          <p className="text-muted-foreground text-lg leading-relaxed">
            Our platform analyzes your resume in real-time, providing immediate insights and suggestions
            as you type. No more guessing what employers are looking for.
          </p>

          <div className="space-y-5 pt-2">
            {detailedFeatures.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className="mt-0.5 p-2 rounded-xl bg-primary/10 h-fit flex-shrink-0">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-base font-semibold mb-1">{feature.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 transition-all btn-shimmer"
          >
            Try it now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="text-center p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
          >
            <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="text-3xl font-extrabold mb-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Features;