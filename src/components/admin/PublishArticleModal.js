'use client';

import { logError } from '../../utils/safeLogger';
import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Calendar, CheckCircle2, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import api from '../../utils/api';
import RichEditor from '../ui/RichEditor';
import { publishArticleModalSchema, validateWithZod } from '../../lib/validation';

const makeClientId = () => `section-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const defaultSections = (articleAbstract = '') => [
  { client_id: makeClientId(), section_key: 'abstract', title: 'Abstract', content_html: articleAbstract, sort_order: 1, image_file: null },
  { client_id: makeClientId(), section_key: 'introduction', title: 'Introduction', content_html: '', sort_order: 2, image_file: null },
  { client_id: makeClientId(), section_key: 'materials_and_methods', title: 'Materials and Methods', content_html: '', sort_order: 3, image_file: null },
  { client_id: makeClientId(), section_key: 'discussion', title: 'Discussion', content_html: '', sort_order: 4, image_file: null },
];

const slugKey = (value, fallback) => String(value || fallback || 'section')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .slice(0, 100);

export default function PublishArticleModal({ isOpen, onClose, onSubmit, articleTitle, articleAbstract = '', magazineId, publicationSections = [] }) {
  const [publicationTitle, setPublicationTitle] = useState(articleTitle || '');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [magazineIssueId, setMagazineIssueId] = useState('');
  const [issues, setIssues] = useState([]);
  const [doi, setDoi] = useState('');
  const [pageStart, setPageStart] = useState('');
  const [pageEnd, setPageEnd] = useState('');
  const [publicationPdf, setPublicationPdf] = useState(null);
  const [metadata, setMetadata] = useState({
    article_type: '',
    article_category: '',
    open_access_label: 'Open Access',
    is_peer_reviewed: true,
    academic_editor: '',
    received_at: '',
    accepted_at: '',
    published_at: '',
    license_statement: '',
    data_availability_statement: '',
    funding_statement: '',
    competing_interests_statement: '',
    abbreviations: '',
    citation_text: '',
  });
  const [sections, setSections] = useState(() => defaultSections(articleAbstract));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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

  useEffect(() => {
    if (!isOpen) return;
    setPublicationTitle(articleTitle || '');
    const safeSections = publicationSections || [];
    if (safeSections.length > 0) {
      const loadedSections = safeSections.map((section, index) => ({
        client_id: makeClientId(),
        id: section.id,
        section_key: section.section_key || slugKey(section.title, `section_${index + 1}`),
        title: section.title || '',
        content_html: section.content_html || '',
        sort_order: section.sort_order || index + 1,
        existing_media_upload_session_id: section.media_upload_session_id || null,
        image_file: null,
      }));
      setSections(loadedSections.some((section) => section.section_key === 'abstract')
        ? loadedSections
        : [{ ...defaultSections(articleAbstract || '')[0] }, ...loadedSections].map((section, index) => ({ ...section, sort_order: index + 1 })));
    } else {
      setSections(defaultSections(articleAbstract || ''));
    }
  }, [isOpen, publicationSections, articleAbstract, articleTitle]);

  const updateSection = (clientId, patch) => {
    setSections((prev) => prev.map((section) => (
      section.client_id === clientId ? { ...section, ...patch } : section
    )));
  };

  const moveSection = (clientId, direction) => {
    setSections((prev) => {
      const next = [...prev];
      const index = next.findIndex((section) => section.client_id === clientId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((section, itemIndex) => ({ ...section, sort_order: itemIndex + 1 }));
    });
  };

  const removeSection = (clientId) => {
    setSections((prev) => prev.filter((section) => section.client_id !== clientId).map((section, itemIndex) => ({ ...section, sort_order: itemIndex + 1 })));
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        client_id: makeClientId(),
        section_key: `custom_section_${prev.length + 1}`,
        title: 'Custom Section',
        content_html: '',
        sort_order: prev.length + 1,
        image_file: null,
      },
    ]);
  };

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
    const publicationSectionsPayload = sections.map((section, index) => ({
      id: section.id,
      section_key: slugKey(section.section_key || section.title, `section_${index + 1}`),
      title: section.title,
      content_html: section.content_html,
      sort_order: index + 1,
      image_file: section.image_file,
      existing_media_upload_session_id: section.existing_media_upload_session_id,
    }));
    const validation = validateWithZod(publishArticleModalSchema, {
      title: publicationTitle,
      published_year: selectedYear,
      published_month: selectedMonth,
      magazine_issue_id: magazineIssueId || null,
      doi,
      page_start: pageStart,
      page_end: pageEnd,
      metadata,
      publication_sections: publicationSectionsPayload,
    });
    setErrors(validation.errors);
    if (!validation.success) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: publicationTitle.trim(),
        published_year: parseInt(selectedYear, 10),
        published_month: selectedMonth,
        magazine_issue_id: magazineIssueId ? parseInt(magazineIssueId, 10) : null,
        doi: doi.trim() || null,
        page_start: pageStart ? parseInt(pageStart, 10) : null,
        page_end: pageEnd ? parseInt(pageEnd, 10) : null,
        publication_pdf: publicationPdf,
        ...metadata,
        publication_sections: publicationSectionsPayload,
      });
      setErrors({});
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
      <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col font-sans">
        
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
        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="p-6 space-y-5 text-left">
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono block">
                Manuscript Title
              </span>
              <input
                type="text"
                value={publicationTitle}
                onChange={(event) => setPublicationTitle(event.target.value)}
                maxLength={255}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-serif text-sm font-bold text-zinc-900 outline-none transition-colors focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
            {Object.keys(errors).length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {Object.values(errors)[0]}
              </div>
            )}

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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono block">Academic Editor</label>
                <input value={metadata.academic_editor} onChange={(e) => setMetadata({ ...metadata, academic_editor: e.target.value })} className="w-full text-xs font-semibold px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono block">Received Date</label>
                <input type="date" value={metadata.received_at} onChange={(e) => setMetadata({ ...metadata, received_at: e.target.value })} className="w-full text-xs font-semibold px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono block">Accepted Date</label>
                <input type="date" value={metadata.accepted_at} onChange={(e) => setMetadata({ ...metadata, accepted_at: e.target.value })} className="w-full text-xs font-semibold px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ['license_statement', 'Copyright / License'],
                ['data_availability_statement', 'Data Availability'],
                ['funding_statement', 'Funding'],
                ['competing_interests_statement', 'Competing Interests'],
                ['abbreviations', 'Abbreviations'],
                ['citation_text', 'Citation Text'],
              ].map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono block">{label}</label>
                  <textarea value={metadata[key]} onChange={(e) => setMetadata({ ...metadata, [key]: e.target.value })} rows={2} className="w-full text-xs font-semibold px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100" />
                </div>
              ))}
            </div>

            <div className="space-y-5 border-t border-zinc-100 pt-5 dark:border-zinc-850">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">Publication Sections</h4>
                <button type="button" onClick={addSection} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800">
                  <Plus className="h-3.5 w-3.5" />
                  Add Section
                </button>
              </div>
              {sections.map((section, index) => (
                <div key={section.client_id} className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono">Section Title</span>
                        <input value={section.title} disabled={section.section_key === 'abstract'} onChange={(e) => updateSection(section.client_id, { title: e.target.value, section_key: slugKey(e.target.value, section.section_key) })} className="mt-1 w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 disabled:opacity-70" />
                      </label>
                      <label className="block">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono">Section Image</span>
                        <span className="mt-1 flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                          <Upload className="h-3.5 w-3.5" />
                          {section.image_file?.name || (section.existing_media_upload_session_id ? 'Existing image retained' : 'Choose image')}
                          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => updateSection(section.client_id, { image_file: event.target.files?.[0] || null })} />
                        </span>
                      </label>
                    </div>
                    <div className="flex items-end gap-1">
                      <button type="button" onClick={() => moveSection(section.client_id, -1)} disabled={index === 0} title="Move section up" className="rounded-lg border border-zinc-200 p-2 text-zinc-600 disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300"><ArrowUp className="h-4 w-4" /></button>
                      <button type="button" onClick={() => moveSection(section.client_id, 1)} disabled={index === sections.length - 1} title="Move section down" className="rounded-lg border border-zinc-200 p-2 text-zinc-600 disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300"><ArrowDown className="h-4 w-4" /></button>
                      <button type="button" onClick={() => removeSection(section.client_id)} disabled={section.section_key === 'abstract'} title={section.section_key === 'abstract' ? 'Abstract is required' : 'Delete section'} className="rounded-lg border border-red-200 p-2 text-red-600 disabled:cursor-not-allowed disabled:opacity-35 dark:border-red-900/60"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <RichEditor value={section.content_html} onChange={(value) => updateSection(section.client_id, { content_html: value })} minHeight="180px" />
                </div>
              ))}
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
