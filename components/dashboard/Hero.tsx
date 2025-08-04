import React from 'react';
import Link from 'next/link';
import { ArrowRight, Upload, CheckCircle, Star } from 'lucide-react';

function Hero() {
  return (
    <div className="relative overflow-hidden pt-8 pb-20 lg:pt-16 lg:pb-28">
      {/* Decorative blurred circles */}
      <div className="hidden md:block absolute top-1/4 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl"></div>
      <div className="hidden md:block absolute bottom-1/3 left-0 -translate-x-1/3 w-72 h-72 rounded-full bg-accent/5 blur-3xl"></div>

      {/* Hero content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left side - Text content */}
          <div className="max-w-xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary font-medium mb-6">
              <Star className="w-4 h-4 mr-1.5" />
              Trusted by 20,000+ professionals
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Optimize your resume with <span className="text-primary">AI-powered</span> analysis
            </h1>

            <p className="text-xl text-muted-foreground mb-8">
              Get personalized feedback, beat applicant tracking systems, and land more interviews with our intelligent resume checker.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary/90 transition-colors"
              >
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
              >
                See how it works
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex items-center">
                <div className="flex -space-x-2 mr-3">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full ring-2 ring-background"
                      style={{
                        backgroundColor: `hsl(${210 + i * 30}, 70%, 70%)`,
                        zIndex: 4 - i
                      }}
                    ></div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    4.9/5 from 2,000+ reviews
                  </div>
                </div>
              </div>
              <div className="flex items-center text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-primary mr-2" />
                <span>Free plan available</span>
              </div>
            </div>
          </div>

          {/* Right side - App preview */}
          <div className="relative lg:ml-auto mt-10 lg:mt-0 max-w-lg lg:max-w-none mx-auto lg:mx-0">
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl">
              {/* App UI Mockup */}
              <div className="bg-card rounded-xl overflow-hidden">
                {/* Header */}
                <div className="bg-muted p-4 flex items-center justify-between border-b border-border">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-destructive"></div>
                    <div className="w-3 h-3 rounded-full bg-accent"></div>
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                  </div>
                  <div className="h-6 w-36 bg-background rounded-md"></div>
                  <div className="h-6 w-6 bg-background rounded-md"></div>
                </div>
                
                {/* Content */}
                <div className="bg-background p-6">
                  <div className="flex justify-between mb-6">
                    <div className="space-y-1">
                      <div className="h-6 w-44 bg-muted rounded-md"></div>
                      <div className="h-4 w-32 bg-muted/50 rounded-md"></div>
                    </div>
                    <div className="h-10 w-28 bg-primary/80 rounded-md flex items-center justify-center text-white text-sm font-medium">
                      <Upload className="h-4 w-4 mr-1" /> Upload
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-6 mb-8">
                    <div className="col-span-3 space-y-5">
                      <div className="space-y-2">
                        <div className="h-5 w-28 bg-muted rounded-md"></div>
                        <div className="h-20 w-full bg-muted/30 rounded-md border border-border"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-5 w-36 bg-muted rounded-md"></div>
                        <div className="h-28 w-full bg-muted/30 rounded-md border border-border"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-muted rounded-md"></div>
                        <div className="h-20 w-full bg-muted/30 rounded-md border border-border"></div>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="bg-card p-4 rounded-lg border border-border h-full">
                        <div className="h-5 w-full bg-primary/20 rounded-md mb-4"></div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-accent mr-2 shrink-0 mt-0.5" />
                            <div className="space-y-1 flex-1">
                              <div className="h-4 w-full bg-muted/70 rounded-sm"></div>
                              <div className="h-3 w-4/5 bg-muted/50 rounded-sm"></div>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-accent mr-2 shrink-0 mt-0.5" />
                            <div className="space-y-1 flex-1">
                              <div className="h-4 w-full bg-muted/70 rounded-sm"></div>
                              <div className="h-3 w-3/5 bg-muted/50 rounded-sm"></div>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="h-5 w-5 rounded-full border-2 border-destructive mr-2 shrink-0 mt-0.5"></div>
                            <div className="space-y-1 flex-1">
                              <div className="h-4 w-full bg-muted/70 rounded-sm"></div>
                              <div className="h-3 w-5/6 bg-muted/50 rounded-sm"></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="h-24 w-full bg-muted/30 rounded-md border border-border"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-10 w-10 rounded-full bg-muted"></div>
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-muted rounded-sm"></div>
                        <div className="h-3 w-24 bg-muted/50 rounded-sm"></div>
                      </div>
                    </div>
                    <div className="h-9 w-28 bg-primary rounded-md"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating badges */}
            <div className="hidden lg:block absolute -top-4 -right-4 bg-accent text-accent-foreground px-3 py-2 rounded-lg shadow-md transform rotate-3">
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-current mr-1" />
                <span className="text-sm font-medium">ATS Friendly</span>
              </div>
            </div>
            
            <div className="hidden lg:block absolute -bottom-2 -left-6 bg-card text-foreground px-3 py-2 rounded-lg shadow-md border border-border transform -rotate-2">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-primary mr-1" />
                <span className="text-sm font-medium">Score: 92/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;