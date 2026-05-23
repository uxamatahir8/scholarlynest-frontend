'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BookOpen, Zap, Globe, ShieldCheck, 
  Check, GraduationCap, ChevronDown, Feather, ArrowRight, Sparkles, BookOpenText
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Home() {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "What is ScholarlyNest?",
      a: "ScholarlyNest is a trusted, open-access platform where researchers, institutions, and readers collaborate on scientific discovery and knowledge sharing."
    },
    {
      q: "How secure is my data?",
      a: "We maintain complete data integrity. All information is secured with enterprise-grade encryption and access control protocols."
    },
    {
      q: "Is there a charge for open-access publishing?",
      a: "No. In alignment with our Open Science Pledge, all publications are funded via institutional grants and community support. Access is free forever."
    }
  ];

  return (
    <div className="flex flex-col w-full min-h-screen">
      <title>Home - ScholarlyNest</title>
      
      {/* 1. IMMERSIVE HERO WITH MESH GRADIENT */}
      <section className="relative w-full min-h-screen pt-40 pb-24 flex items-center justify-center overflow-hidden">
        {/* Background Image Banner */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/main-banner.jpg" 
            alt="Main Banner Background" 
            fill 
            priority 
            className="object-cover object-center scale-105 filter brightness-[0.85] dark:brightness-[0.45] transition-all duration-700" 
          />
          {/* Responsive contrast gradient mask and radial mesh overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/85 via-[var(--background)]/75 to-[var(--background)] pointer-events-none" />
          <div className="absolute inset-0 bg-mesh opacity-65 mix-blend-screen pointer-events-none" />
          {/* Deep dark fade overlay at bottom */}
          <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center animate-in fade-in zoom-in-95 duration-1000 mt-20">
          <div className="inline-flex items-center space-x-2 px-4 py-2 glass-panel rounded-full text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)] mb-8 shadow-sm hover:scale-105 transition-all duration-300 cursor-default border-amber-500/25 dark:border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)] animate-pulse" />
            <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-[var(--accent-gold)]" /> The Open Science Standard</span>
          </div>
          
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[var(--foreground)] leading-[1.1] mb-6">
            Accelerating the Frontier of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-[var(--accent)] to-[var(--accent-gold)] dark:from-blue-400 dark:to-[var(--accent-gold)] italic font-serif">Scientific Discovery</span>
          </h1>
          
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed max-w-2xl mx-auto mb-10 font-medium">
            ScholarlyNest connects researchers, editors, and institutions in a high-velocity, open-access publication pipeline. Secure, pristine, and optimized for immediate global indexation.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link href="/magazines" className="w-full sm:flex-1">
              <Button variant="primary" size="lg" className="w-full shadow-2xl flex items-center justify-center gap-2 group transition-all duration-300 hover:shadow-blue-500/10">
                <BookOpenText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Explore Catalog</span>
              </Button>
            </Link>
            <Link href="/admin" className="w-full sm:flex-1">
              <Button variant="secondary" size="lg" className="w-full shadow-xl flex items-center justify-center gap-2 group border-[var(--muted-border)] bg-[var(--background)]/30 backdrop-blur hover:bg-[var(--foreground)]/5 transition-all duration-300">
                <Feather className="w-4 h-4 group-hover:rotate-12 transition-transform text-[var(--accent-gold)]" />
                <span>Submit Manuscript</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-[var(--muted)]">
          <ChevronDown className="w-6 h-6 opacity-75" />
        </div>
      </section>

      {/* 2. PLATFORM METRICS (FLOATING BAR) */}
      <section className="relative z-20 -mt-12 max-w-7xl mx-auto px-4 w-full">
        <div className="glass-panel rounded-2xl p-8 sm:p-10 shadow-2xl border border-[var(--accent)]/10 dark:border-white/5 bg-[var(--card-bg)]/90 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[var(--muted-border)]">
            <div className="flex flex-col space-y-2 hover:scale-105 transition-transform duration-500 py-4 md:py-0">
              <span className="text-5xl font-bold tracking-tight text-[var(--foreground)] drop-shadow-sm font-serif">100%</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Open Access Archiving</span>
            </div>
            <div className="flex flex-col space-y-2 hover:scale-105 transition-transform duration-500 py-4 md:py-0">
              <span className="text-5xl font-bold tracking-tight text-[var(--foreground)] drop-shadow-sm font-serif">14<span className="text-2xl text-[var(--accent)] dark:text-blue-400 font-sans">d</span></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Avg. Editorial Turnaround</span>
            </div>
            <div className="flex flex-col space-y-2 hover:scale-105 transition-transform duration-500 py-4 md:py-0">
              <span className="text-5xl font-bold tracking-tight text-[var(--foreground)] drop-shadow-sm font-serif">4.8<span className="text-2xl text-[var(--accent-gold)] font-sans">x</span></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Citation Multiplier</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE PILLARS (BENTO BOX GRID) */}
      <section className="py-32 max-w-7xl mx-auto px-4 w-full">
        <div className="text-center space-y-3 mb-16">
          <span className="text-[10px] font-mono text-[var(--accent-gold)] uppercase tracking-widest font-bold">Platform Capabilities</span>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-[var(--foreground)]">Designed for Rigor</h2>
          <p className="text-sm text-[var(--muted)] max-w-lg mx-auto font-medium">A modern architecture configured for maximum editorial performance and citation longevity.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[280px]">
          
          {/* Feature 1 (Large Span) */}
          <div className="glass-panel rounded-3xl p-8 md:col-span-8 flex flex-col justify-end relative overflow-hidden group hover-glow border-[var(--muted-border)] shadow-sm hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-500/20 transition-colors duration-750" />
            <div className="w-12 h-12 bg-[var(--background)] border border-[var(--muted-border)] rounded-2xl flex items-center justify-center mb-6 shadow-lg z-10">
              <ShieldCheck className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="z-10 space-y-2">
              <h3 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                Stringent Review Process
              </h3>
              <p className="text-sm font-medium leading-relaxed text-[var(--muted)] max-w-md">Rigid editorial workflows ensuring high-quality publications with transparent multi-state manuscript tracking and peer auditing.</p>
            </div>
          </div>

          {/* Feature 2 (Small Span) */}
          <div className="glass-panel rounded-3xl p-8 md:col-span-4 flex flex-col justify-end relative overflow-hidden group hover-glow border-[var(--muted-border)] shadow-sm hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-yellow-500/20 transition-colors duration-750" />
            <div className="w-12 h-12 bg-[var(--background)] border border-[var(--muted-border)] rounded-2xl flex items-center justify-center mb-6 shadow-lg z-10">
              <Zap className="w-6 h-6 text-[var(--accent-gold)]" />
            </div>
            <div className="z-10 space-y-2">
              <h3 className="text-xl font-bold text-[var(--foreground)]">Direct Cloud Uploads</h3>
              <p className="text-sm font-medium leading-relaxed text-[var(--muted)]">High-bandwidth media bypasses limitations via secure S3-compliant cloud pipelines.</p>
            </div>
          </div>

          {/* Feature 3 (Small Span) */}
          <div className="glass-panel rounded-3xl p-8 md:col-span-4 flex flex-col justify-end relative overflow-hidden group hover-glow border-[var(--muted-border)] shadow-sm hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-colors duration-750" />
            <div className="w-12 h-12 bg-[var(--background)] border border-[var(--muted-border)] rounded-2xl flex items-center justify-center mb-6 shadow-lg z-10">
              <Globe className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="z-10 space-y-2">
              <h3 className="text-xl font-bold text-[var(--foreground)]">Global Indexing</h3>
              <p className="text-sm font-medium leading-relaxed text-[var(--muted)]">Automatic injection of semantic metadata guarantees immediate indexation.</p>
            </div>
          </div>

          {/* Feature 4 (Large Span) */}
          <div className="glass-panel rounded-3xl p-8 md:col-span-8 flex flex-col justify-end relative overflow-hidden group hover-glow border-[var(--muted-border)] shadow-sm hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--accent)]/5 pointer-events-none group-hover:to-[var(--accent)]/10 transition-colors duration-750" />
            <div className="w-12 h-12 bg-[var(--background)] border border-[var(--muted-border)] rounded-2xl flex items-center justify-center mb-6 shadow-lg z-10">
              <BookOpen className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="z-10 space-y-2">
              <h3 className="text-xl font-bold text-[var(--foreground)]">Advanced Publishing Workflows</h3>
              <p className="text-sm font-medium leading-relaxed text-[var(--muted)] max-w-lg">Our platform orchestrates a pristine publishing lifecycle. From draft submission to global distribution, authors and editors collaborate securely inside a modern workspace.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 5. FAQ */}
      <section className="py-32 max-w-5xl mx-auto px-4 w-full">
        <div className="text-center space-y-3 mb-16">
          <span className="text-[10px] font-mono text-[var(--accent-gold)] uppercase tracking-widest font-bold">Inquiries</span>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-[var(--foreground)]">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="glass-panel rounded-2xl overflow-hidden transition-all duration-300 shadow-sm border-[var(--muted-border)]">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex justify-between items-center text-left p-6 font-bold text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-colors focus:outline-none cursor-pointer"
              >
                <span className="text-sm sm:text-base font-semibold">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-[var(--muted)] transition-transform duration-300 ${activeFaq === index ? 'rotate-180 text-[var(--accent-gold)]' : ''}`} />
              </button>
              {activeFaq === index && (
                <div className="px-6 pb-6 text-xs sm:text-sm font-medium text-[var(--muted)] leading-relaxed animate-in fade-in slide-in-from-top-2">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. PLEDGE */}
      <section className="py-24 border-t border-[var(--muted-border)] bg-[var(--background)] relative">
        <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 text-center space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center mx-auto shadow-xl border border-[var(--accent-gold)]/20 hover:scale-110 transition-transform duration-300">
            <GraduationCap className="w-8 h-8 text-[var(--accent-gold)]" />
          </div>
          <h3 className="font-serif text-3xl font-bold text-[var(--foreground)]">
            Our Open Science Advocacy Pledge
          </h3>
          <p className="text-sm font-medium text-[var(--muted)] leading-relaxed max-w-2xl mx-auto">
            We pledge to maintain our open-access values persistently. All scientific data, mathematical proofs, and computational models published inside ScholarlyNest remain permanently unrestricted by payroll systems or corporate access limits. Knowledge belongs to humanity.
          </p>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-gold)] block pt-6 font-mono">ScholarlyNest Advisory & Editorial Council</span>
        </div>
      </section>

    </div>
  );
}
