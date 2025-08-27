import React from 'react';
import { 
  FileSearch, 
  AlignLeft, 
  Sparkles, 
  LineChart, 
  Layers, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';


const features = [
  {
    title: "AI-Powered Resume Analysis",
    description: "Advanced algorithms analyze your resume against job descriptions to identify strengths and improvement areas.",
    icon: Sparkles,
  },
  {
    title: "ATS Compatibility Check",
    description: "Ensure your resume passes through Applicant Tracking Systems with format and keyword optimization.",
    icon: FileSearch,
  },
  {
    title: "Content Quality Scoring",
    description: "Receive detailed feedback on the quality, impact, and relevance of your resume content.",
    icon: AlignLeft,
  },
  {
    title: "Industry Benchmarking",
    description: "Compare your resume against industry standards and top-performing candidates.",
    icon: LineChart,
  }
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

function Features() {
  return (
    <div className="space-y-24">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
          Everything you need to create an exceptional resume
        </h2>
        <p className="text-lg text-muted-foreground">
          Our AI-powered platform provides comprehensive analysis and tailored recommendations 
          to help you build a resume that stands out to employers and beats applicant tracking systems.
        </p>
      </div>

      {/* Main features grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {features.map((feature) => (
          <div 
            key={feature.title} 
            className="relative group overflow-hidden rounded-2xl border border-border p-6 hover:shadow-md transition-shadow"
          >
            {/* Feature icon */}
            <div className="mb-4 p-2.5 rounded-xl bg-primary/10 inline-flex">
              <feature.icon className="h-6 w-6 text-primary" />
            </div>
            
            {/* Background decorator */}
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/[0.03] rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            
            {/* Content */}
            <div className="relative">
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feature spotlight - Visual demo section */}
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="relative rounded-2xl overflow-hidden border border-border p-1 shadow-md">
          {/* Placeholder for an actual screenshot of your application - replace with your actual image */}
          <div className="bg-card aspect-[4/3] rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 flex flex-col p-6">
              {/* Mock resume analysis interface */}
              <div className="flex justify-between items-center mb-6">
                <div className="h-7 w-32 bg-background rounded-md"></div>
                <div className="flex space-x-2">
                  <div className="h-7 w-7 bg-primary/20 rounded-md"></div>
                  <div className="h-7 w-7 bg-background rounded-md"></div>
                </div>
              </div>
              
              <div className="flex-1 flex gap-4">
                <div className="w-1/2 p-3 bg-background rounded-lg">
                  <div className="h-4 w-3/4 bg-muted rounded"></div>
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-full bg-muted/70 rounded"></div>
                    <div className="h-3 w-full bg-muted/70 rounded"></div>
                    <div className="h-3 w-4/5 bg-muted/70 rounded"></div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="h-4 w-1/2 bg-muted rounded"></div>
                    <div className="mt-3 space-y-2">
                      <div className="h-3 w-full bg-muted/70 rounded"></div>
                      <div className="h-3 w-full bg-muted/70 rounded"></div>
                    </div>
                  </div>
                </div>
                
                <div className="w-1/2 p-3 bg-background rounded-lg">
                  <div className="h-4 w-1/2 bg-primary/20 rounded"></div>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-accent mr-2"></div>
                      <div className="h-3 flex-1 bg-muted/60 rounded"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-primary/30 mr-2"></div>
                      <div className="h-3 flex-1 bg-muted/60 rounded"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-destructive/30 mr-2"></div>
                      <div className="h-3 flex-1 bg-muted/60 rounded"></div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <div className="h-8 w-28 bg-primary rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary font-medium">
            Real-time analysis
          </div>
          
          <h3 className="text-2xl md:text-3xl font-bold">
            Get instant feedback as you build your resume
          </h3>
          
          <p className="text-muted-foreground text-lg">
            Our platform analyzes your resume in real-time, providing immediate insights and suggestions
            as you type. No more guessing what employers are looking for.
          </p>
          
          <div className="space-y-5 pt-3">
            {detailedFeatures.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className="mt-1 p-1.5 rounded-lg bg-primary/10 h-fit">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-1">{feature.title}</h4>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          
        <Link 
  href="/dashboard" 
  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-blue-500 bg-blue-100/30 backdrop-blur-md border border-blue-300/30 hover:bg-blue-100/50 hover:text-blue-600 transition-all duration-200 shadow-sm"
>
  Try it now <ArrowRight className="ml-2 h-4 w-4" />
</Link>

        </div>
      </div>

      {/* Statistics section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-6">
        {[
          { value: "93%", label: "Improved interview rate" },
          { value: "2.5×", label: "Faster job search" },
          { value: "20K+", label: "Resumes optimized" },
          { value: "98%", label: "Customer satisfaction" }
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
            <div className="text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Features;