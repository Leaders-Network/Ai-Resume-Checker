"use client"
import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/dashboard/Hero';
import Features from '@/components/dashboard/Features';
import Companies from '@/components/dashboard/Companies';
import Testimonials from '@/components/dashboard/Testimonials';
import Pricing from '@/components/dashboard/Pricing';
import CTA from '@/components/dashboard/CTA';
import Footer from '@/components/dashboard/Footer';

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero section with enhanced gradient background */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/20 z-0"></div>
        <div className="relative z-10">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Hero />
          </div>
        </div>
      </section>
      
      {/* Features section with refined background */}
      <section className="bg-background py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Features />
        </div>
      </section>
      
      {/* Companies section with subtle accent background */}
      <section className="bg-accent/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Companies />
        </div>
      </section>
      
      {/* Testimonials section with card styling */}
      <section className="py-28 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-2xl shadow-lg p-10 border border-border">
            <Testimonials />
          </div>
        </div>
      </section>
      
      {/* Pricing section with refined colors */}
      <section className="bg-muted py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card text-card-foreground rounded-2xl shadow-xl p-10 border border-border">
            <Pricing />
          </div>
        </div>
      </section>
      
      {/* CTA section with more vibrant primary background */}
      <section className="bg-primary text-primary-foreground py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <CTA />
        </div>
      </section>
      
      {/* Footer with improved styling */}
      <footer className="bg-secondary py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Footer />
        </div>
      </footer>
    </main>
  );
}