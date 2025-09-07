import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote, Award, TrendingUp, Clock, Check, type LucideIcon } from 'lucide-react';

// Define types for our data structures
type ImpactType = 'interviews' | 'response' | 'ats' | 'job';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  image: string;
  content: string;
  rating: number;
  impact: {
    type: ImpactType;
    value: string;
    timeframe: string;
  };
  companyLogo: string;
  industry: string;
  beforeScore: number;
  afterScore: number;
}

// Sample testimonial data with more detailed info
const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Alex Thompson",
    role: "Software Engineer",
    company: "TechCorp",
    image: "/avatars/alex.jpg",
    content: "Using this resume checker completely transformed my job search. I went from zero callbacks to five interview requests in just one week after optimizing my resume with the AI suggestions.",
    rating: 5,
    impact: {
      type: "interviews",
      value: "5 interviews",
      timeframe: "one week"
    },
    companyLogo: "/logos/techcorp.svg",
    industry: "Technology",
    beforeScore: 67,
    afterScore: 92
  },
  {
    id: 2,
    name: "Sarah Johnson",
    role: "Marketing Director",
    company: "BrandWave",
    image: "/avatars/sarah.jpg",
    content: "The keyword analysis feature is incredible. It identified several critical terms missing from my resume that were specific to my industry. After adding them, my resume started getting noticed by recruiters immediately.",
    rating: 5,
    impact: {
      type: "response",
      value: "300% increase",
      timeframe: "in recruiter responses"
    },
    companyLogo: "/logos/brandwave.svg",
    industry: "Marketing",
    beforeScore: 58,
    afterScore: 94
  },
  {
    id: 3,
    name: "Michael Rodriguez",
    role: "Product Manager",
    company: "InnovateCo",
    image: "/avatars/michael.jpg",
    content: "I was skeptical at first, but the detailed feedback helped me quantify my achievements in a way that really stands out. The ATS compatibility check also caught formatting issues that were causing my resume to be rejected by automated systems.",
    rating: 5,
    impact: {
      type: "ats",
      value: "Passed 100%",
      timeframe: "of ATS screens"
    },
    companyLogo: "/logos/innovateco.svg",
    industry: "Product",
    beforeScore: 72,
    afterScore: 89
  },
  {
    id: 4,
    name: "Emily Zhang",
    role: "Data Scientist",
    company: "AnalyticsPro",
    image: "/avatars/emily.jpg",
    content: "As someone transitioning between industries, this tool was invaluable. It helped me highlight transferable skills and reshape my experience to match what employers in my target industry were looking for. Landed my dream job within a month!",
    rating: 5,
    impact: {
      type: "job",
      value: "Dream job",
      timeframe: "within 1 month"
    },
    companyLogo: "/logos/analyticspro.svg",
    industry: "Data Science",
    beforeScore: 63,
    afterScore: 91
  }
];

interface Stat {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

// Get impact icon based on type
const getImpactIcon = (type: ImpactType): LucideIcon => {
  switch(type) {
    case 'interviews': return TrendingUp;
    case 'response': return TrendingUp;
    case 'ats': return Check;
    case 'job': return Award;
    default: return Clock;
  }
};

const summaryStats: Stat[] = [
  { value: "98%", label: "Satisfaction rate", icon: Star, color: "text-yellow-400" },
  { value: "2.3×", label: "More interviews", icon: TrendingUp, color: "text-primary" },
  { value: "87%", label: "ATS pass rate", icon: Check, color: "text-green-500" },
  { value: "<3 wks", label: "Average job search", icon: Clock, color: "text-blue-500" }
];

function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<"prev" | "next" | null>(null);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-advance slides
  useEffect(() => {
    if (!isPaused) {
      slideTimerRef.current = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % testimonials.length);
        setDirection('next');
      }, 8000);
    }
    
    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, [isPaused]);
  
  const handlePrev = () => {
    if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    setIsPaused(true);
    setDirection('prev');
    setActiveIndex(prev => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    setIsPaused(true);
    setDirection('next');
    setActiveIndex(prev => (prev + 1) % testimonials.length);
  };
  
  const goToSlide = (index: number) => {
    if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    setIsPaused(true);
    setDirection(index > activeIndex ? 'next' : 'prev');
    setActiveIndex(index);
  };
  
  const resumePause = () => {
    setIsPaused(false);
  };

  const placeholderInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <div className="py-8">
      <div className="text-center mb-16">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary font-medium mb-4">
          <Star className="w-4 h-4 mr-1.5 fill-current" />
          Success Stories
        </div>
        
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Transformed resumes. Transformed careers.
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          See how professionals across industries have boosted their job search results with our AI-powered resume tools.
        </p>
      </div>

      {/* Featured testimonial carousel */}
      <div 
        className="relative max-w-5xl mx-auto mb-20"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={resumePause}
      >
        <div className="absolute -top-6 -left-6 z-0">
          <Quote className="h-16 w-16 text-primary/10" />
        </div>
        
        {/* Progress indicator */}
        <div className="absolute -top-3 left-0 right-0 flex justify-center z-20">
          <div className="bg-card px-4 py-1.5 rounded-full shadow-md border border-border flex gap-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === activeIndex
                    ? 'w-10 bg-primary'
                    : 'w-3 bg-primary/30 hover:bg-primary/50'
                }`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* Main testimonial card */}
        <div className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-md relative z-10 overflow-hidden">
          {/* Animated testimonials */}
          <div className="relative h-full">
            {testimonials.map((testimonial, idx) => {
              const isActive = idx === activeIndex;
              const wasRecent = (idx === activeIndex - 1) || (activeIndex === 0 && idx === testimonials.length - 1);
              const willBeNext = (idx === activeIndex + 1) || (activeIndex === testimonials.length - 1 && idx === 0);
              
              const slideClass = isActive
                ? 'relative opacity-100 transition-all duration-700'
                : 'absolute top-0 left-0 w-full transition-all duration-700 opacity-0';
              
              return (
                <div 
                  key={testimonial.id}
                  className={slideClass}
                  style={{
                    transform: isActive ? 'translateX(0)' : (
                      direction === 'next' 
                        ? (wasRecent ? 'translateX(-100px)' : 'translateX(100px)')
                        : (willBeNext ? 'translateX(-100px)' : 'translateX(100px)')
                    ),
                    visibility: isActive ? 'visible' : 'hidden'
                  }}
                >
                  <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Left column - Main content */}
                    <div className="flex-1">
                      {/* Rating stars */}
                      <div className="flex items-center mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      
                      {/* Testimonial quote */}
                      <blockquote className="text-xl leading-relaxed mb-8">
                        {testimonial.content}
                      </blockquote>
                      
                      {/* Author info with company */}
                      <div className="flex items-center gap-4">
                        {/* User avatar or placeholder */}
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold relative overflow-hidden">
                          {placeholderInitials(testimonial.name)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{testimonial.name}</div>
                          <div className="text-muted-foreground flex items-center flex-wrap gap-x-2">
                            <span>{testimonial.role}</span>
                            <span className="text-xs">•</span>
                            <span>{testimonial.company}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right column - Impact */}
                    <div className="w-full lg:w-72 shrink-0 space-y-6">
                      {/* Resume score improvement */}
                      <div className="bg-background rounded-xl p-5 border border-border">
                        <div className="text-sm text-muted-foreground mb-2">Resume Score Improvement</div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Before</span>
                          <span className="font-medium">{testimonial.beforeScore}/100</span>
                        </div>
                        <div className="h-2 w-full bg-muted/50 rounded-full mb-3 overflow-hidden">
                          <div 
                            className="h-full bg-muted rounded-full"
                            style={{width: `${testimonial.beforeScore}%`}}
                          ></div>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">After</span>
                          <span className="font-medium">{testimonial.afterScore}/100</span>
                        </div>
                        <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{width: `${testimonial.afterScore}%`}}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Key impact */}
                      <div className="bg-primary/10 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                          {React.createElement(getImpactIcon(testimonial.impact.type), {
                            className: 'h-5 w-5 text-primary'
                          })}
                          <div className="text-sm font-medium">Key Impact</div>
                        </div>
                        <div className="text-primary font-semibold text-lg">
                          {testimonial.impact.value}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.impact.timeframe}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Navigation arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-4 md:-left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background border border-border shadow-md hover:bg-muted transition-colors z-20"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <button
          onClick={handleNext}
          className="absolute right-4 md:-right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background border border-border shadow-md hover:bg-muted transition-colors z-20"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      
      {/* Summary metrics */}
      <div className="mb-20 max-w-5xl mx-auto bg-background rounded-2xl border border-border p-8 shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {summaryStats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Testimonial quotes grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Generate 6 quote cards with different designs */}
          {[...Array(6)].map((_, idx) => {
            // Cycle through testimonials for content
            const testimonial = testimonials[idx % testimonials.length];
            
            // Alternate between different card styles
            const cardStyles = [
              "bg-background border border-border hover:shadow-md",
              "bg-primary/5 border border-primary/10 hover:border-primary/20",
              "bg-accent/10 border border-accent/10 hover:shadow-md",
            ];
            
            const cardStyle = cardStyles[idx % cardStyles.length];
            
            return (
              <div 
                key={idx}
                className={`rounded-xl p-6 transition-all ${cardStyle}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Quote className="h-5 w-5 text-primary/70" />
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                
                <blockquote className="text-sm mb-4 line-clamp-4">
                  {testimonial.content}
                </blockquote>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-medium">
                      {placeholderInitials(testimonial.name)}
                    </div>
                    <div className="text-sm font-medium">{testimonial.name}</div>
                  </div>
                  <div className="text-xs px-2 py-1 rounded bg-background text-muted-foreground">
                    {testimonial.industry}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Testimonials;