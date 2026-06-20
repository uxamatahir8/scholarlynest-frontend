'use client';

import { logError } from '../../utils/safeLogger';
import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Loader2, Upload, X } from 'lucide-react';
import api from '../../utils/api';

export default function PublishArticleModal({ isOpen, onClose, onSubmit, articleTitle, magazineId }) {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [magazineIssueId, setMagazineIssueId] = useState('');
  const [issues, setIssues] = useState([]);
  const [doi, setDoi] = useState('');
  const [pageStart, setPageStart] = useState('');
  const [pageEnd, setPageEnd] = useState('');
  const [publicationPdf, setPublicationPdf] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !magazineId) return;

    const loadIssues = async () => {
      try {
        const res = await api.get('/admin/issues', { params: { magazine_id: magazineId, per_page: 100 } });
        setIssues(res.data?.data || []);
      } catch (err) {
        logError('Failed to load magazine issues', err);
        setIssues([]);
      }
    };

    loadIssues();
  }, [isOpen, magazineId]);

  if (!isOpen) return null;

  // Generate years dynamically up to the 2026 threshold
  const years = [];
  for (let y = 2026; y >= 2012; y--) {
    years.push(String(y));
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        published_year: parseInt(selectedYear, 10),
        published_month: selectedMonth,
        magazine_issue_id: magazineIssueId ? parseInt(magazineIssueId, 10) : null,
        doi: doi.trim() || null,
        page_start: pageStart ? parseInt(pageStart, 10) : null,
        page_end: pageEnd ? parseInt(pageEnd, 10) : null,
        publication_pdf: publicationPdf,
      });
    } catch (err) {
      logError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Glass backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/45 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
      />
      
      {/* Modal Container */}
      <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col font-sans">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between">
          <div className="text-left space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">
              Production Stage
            </span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase leading-none font-sans">
              Publish Manuscript
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 rounded-lg text-zinc-405 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 text-left">
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono block">
                Manuscript Title
              </span>
              <p className="text-xs font-serif font-bold text-zinc-800 dark:text-zinc-200 leading-normal">
                {articleTitle}
              </p>
            </div>

            <div className="h-px bg-zinc-100 dark:bg-zinc-850" />

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono block">
                Issue
              </label>
              <select
                value={magazineIssueId}
                onChange={(e) => setMagazineIssueId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-100"
              >
                <option value="">No issue selected</option>
                {issues.map((issue) => (
                  <option key={issue.id} value={issue.id}>
                    Volume {issue.volume_number}, Issue {issue.issue_number}{issue.special_title ? ` - ${issue.special_title}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Select Year */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono block">
                  Select Year
                </label>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    required
                    className="w-full text-xs font-semibold pl-3 pr-8 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-105 cursor-pointer appearance-none font-sans"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Select Month */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono block">
                  Select Month
                </label>
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    required
                    className="w-full text-xs font-semibold pl-3 pr-8 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-105 cursor-pointer appearance-none font-sans"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono block">
                DOI
              </label>
              <input
                type="text"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                placeholder="10.xxxx/example"
                className="w-full text-xs font-semibold px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono block">
                  Page Start
                </label>
                <input
                  type="number"
                  min="1"
                  value={pageStart}
                  onChange={(e) => setPageStart(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono block">
                  Page End
                </label>
                <input
                  type="number"
                  min="1"
                  value={pageEnd}
                  onChange={(e) => setPageEnd(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono block">
                Final Publication PDF
              </label>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{publicationPdf?.name || 'Choose PDF'}</span>
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setPublicationPdf(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-6 py-4.5 bg-zinc-50/50 dark:bg-zinc-950/20 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm transition-colors cursor-pointer disabled:opacity-50 font-sans"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
              <span>Finalize Publication</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
