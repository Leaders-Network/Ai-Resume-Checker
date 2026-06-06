"use client"
import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/dashboard/Hero';
import Features from '@/components/dashboard/Features';
// import Companies from '@/components/dashboard/Companies';
import Testimonials from '@/components/dashboard/Testimonials';
import Pricing from '@/components/dashboard/Pricing';
import CTA from '@/components/dashboard/CTA';
import Footer from '@/components/dashboard/Footer';

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Sticky Navbar ── */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-screen-2xl mx-auto">
          <Navbar />
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Multi-layer gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-background to-violet-500/5 pointer-events-none" />
        {/* Grid overlay texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-6">
          <Hero />
        </div>
      </section>

      {/* ── Companies / Social Proof ── 
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-muted/40 via-accent/20 to-muted/40 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Companies />
        </div>
      </section>
      */}

      {/* ── Features ── */}
      <section className="py-28 relative" id="features">
        <div className="absolute inset-0 bg-background pointer-events-none" />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-6">
          <Features />
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-28 relative" id="testimonials">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-6">
          <div className="bg-card rounded-3xl shadow-xl border border-border/60 p-8 md:p-12 overflow-hidden relative">
            {/* Corner orbs */}
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-violet-500/5 blur-2xl pointer-events-none" />
            <Testimonials />
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-28 relative" id="pricing">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background pointer-events-none" />
        <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-6">
          <div className="bg-card text-card-foreground rounded-3xl shadow-2xl border border-border/60 p-8 md:p-12 overflow-hidden relative">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
            <Pricing />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 relative overflow-hidden">
        {/* Rich gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-primary to-violet-700 pointer-events-none" />
        {/* Mesh overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />
        {/* Glowing orbs */}
        <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-60 w-60 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-6">
          <CTA />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative border-t border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/40 to-background pointer-events-none" />
        <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-6 py-20">
          <Footer />
        </div>
      </footer>

    </main>
  );
}