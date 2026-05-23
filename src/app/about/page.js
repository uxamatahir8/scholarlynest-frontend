'use client';

import React from 'react';
import { BookOpen, ShieldCheck, Globe, Star, Users, Award, Landmark } from 'lucide-react';
import PageBanner from '../../components/PageBanner';

export default function AboutPage() {
  return (
    <div className="bg-[var(--background)] min-height-screen transition-premium">
      <title>About Us  - ScholarlyNest</title>
      <PageBanner 
        title="Institutional Charter" 
        description="ScholarlyNest is a state-of-the-art academic publishing platform designed to bridge the gap between rigorous peer-reviewed research and rapid interdisciplinary collaboration."
        customLabels={{ about: 'About Us' }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* GUIDING PRINCIPLES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="p-6 bg-white dark:bg-[#121211] border border-zinc-200/80 dark:border-zinc-800/60 rounded-lg shadow-sm transition-all hover:-translate-y-1">
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 w-fit rounded-md text-zinc-800 dark:text-zinc-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-white mt-4">
              Peer Review Excellence
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Every author publication undergoes a rigorous double-blind peer review matrix managed by verified institutional editors to maintain standard academic integrity.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-[#121211] border border-zinc-200/80 dark:border-zinc-800/60 rounded-lg shadow-sm transition-all hover:-translate-y-1">
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 w-fit rounded-md text-zinc-800 dark:text-zinc-200">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-white mt-4">
              Global Open Access
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              We believe in free dissemination of scientific knowledge. All articles, research blueprints, and methodologies are open-access and fully indexable worldwide.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-[#121211] border border-zinc-200/80 dark:border-zinc-800/60 rounded-lg shadow-sm transition-all hover:-translate-y-1">
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 w-fit rounded-md text-zinc-800 dark:text-zinc-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-white mt-4">
              Interdisciplinary Focus
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Fostering collaborative cross-connections between Intelligent Systems, Theoretical Physics, and Complex Biochemical Systems under a unified publishing model.
            </p>
          </div>
        </div>

        {/* MISSION DETAILED ROW */}
        <div className="border-t border-zinc-200/80 dark:border-zinc-800/60 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Institutional Alignment
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-2">
                A Unified Gateway for Scholars and Institutions
              </h2>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 mt-4 leading-relaxed">
                By offering a dynamic digital workspace where scholars can publish fully formatted scientific manuscripts, we empower academic research departments to accelerate the time-to-market of critical research.
              </p>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 mt-4 leading-relaxed">
                ScholarlyNest implements full Role-Based Access Controls (RBAC), advanced metadata indexing, rich media attachments table references, and soft deletes. This guarantees audit compliance, digital preservation, and institutional accountability.
              </p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/40 p-8 rounded-lg">
              <h4 className="font-serif text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest mb-6">
                Platform Statistics
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    <span>Average Peer Review Cycle</span>
                    <span>14 Days</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-zinc-800 dark:bg-zinc-200 h-full w-[85%] rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    <span>Open Access Citation Multiplier</span>
                    <span>2.4x Impact</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-zinc-800 dark:bg-zinc-200 h-full w-[95%] rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    <span>Double-Blind Acceptance Rate</span>
                    <span>18.6%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-zinc-800 dark:bg-zinc-200 h-full w-[65%] rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOUNDATIONAL pillars */}
        <div className="border-t border-zinc-200/80 dark:border-zinc-800/60 pt-16">
          <h2 className="font-serif text-2xl font-bold text-center text-zinc-900 dark:text-white mb-12">
            The Scholarly Advisory Council
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 bg-white dark:bg-[#121211] border border-zinc-200/80 dark:border-zinc-800/60 rounded-md text-center">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-full mx-auto flex items-center justify-center font-serif text-sm font-bold text-zinc-800 dark:text-zinc-200">
                AE
              </div>
              <h4 className="font-serif text-sm font-bold text-zinc-900 dark:text-white mt-3">
                Dr. Alistair Vance
              </h4>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-semibold mt-1">
                Editor-in-Chief
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Theoretical Physics, Stanford Research Institute
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-[#121211] border border-zinc-200/80 dark:border-zinc-800/60 rounded-md text-center">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-full mx-auto flex items-center justify-center font-serif text-sm font-bold text-zinc-800 dark:text-zinc-200">
                SL
              </div>
              <h4 className="font-serif text-sm font-bold text-zinc-900 dark:text-white mt-3">
                Dr. Sophia Lovelace
              </h4>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-semibold mt-1">
                Director of Intelligence
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Complex Machine Learning Systems, Cambridge
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-[#121211] border border-zinc-200/80 dark:border-zinc-800/60 rounded-md text-center">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-full mx-auto flex items-center justify-center font-serif text-sm font-bold text-zinc-800 dark:text-zinc-200">
                MK
              </div>
              <h4 className="font-serif text-sm font-bold text-zinc-900 dark:text-white mt-3">
                Dr. Marcus Kincaid
              </h4>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-semibold mt-1">
                Biomedical Chair
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Biochemical & Cellular Synthesis, MIT Center
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
