'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import api from '../../../../utils/api';
import dynamic from 'next/dynamic';

const RichEditor = dynamic(() => import('../../../../components/ui/RichEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      <span className="ml-3 text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Loading Editor Workspace...</span>
    </div>
  )
});
import {
  Save, Eye, FileText, ArrowLeft,
  Loader2, CheckCircle2, AlertCircle, Code, Edit3
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import Link from 'next/link';

export default function CmsPageEditWorkspace() {
  const params = useParams();
  const router = useRouter();
  const slug = params ? params.slug : null;
  const { user, hasRole, hasPermission, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Content state management
  const [pageData, setPageData] = useState(null);
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');

  // UI states
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' | 'html'
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Custom Validation warnings
  const [validationErrors, setValidationErrors] = useState({});

  // Human-readable labels mapped to slugs
  const pageDetails = {
    terms: {
      name: 'Terms of Service',
      description: 'Main regulatory framework, open access licensing protocols, and editorial codes of conduct.'
    },
    privacy: {
      name: 'Privacy Policy',
      description: 'Manuscript data isolation, author identifier decoupling, and metadata indexation disclosures.'
    },
    manifests: {
      name: 'Metadata Manifests',
      description: 'OAI-PMH compliance block description and global schema search specifications.'
    }
  };

  const activePageInfo = (slug && pageDetails[slug]) || {
    name: 'CMS Page Content',
    description: 'Dynamic platform resources management.'
  };

  // Fetch page details
  useEffect(() => {
    if (!slug) return;

    const fetchPageContent = async () => {
      try {
        setFetching(true);
        setErrorMsg('');
        const response = await api.get(`/cms/${slug}`);
        setPageData(response.data);
        setTitle(response.data.title);
        setContentHtml(response.data.content_html);
      } catch (err) {
        console.error('Failed to load page content', err);
        setErrorMsg('We were unable to load the existing page content from the server.');
      } finally {
        setFetching(false);
      }
    };

    fetchPageContent();
  }, [slug]);

  // Validations
  const validateForm = () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = 'Page title is required.';
    } else if (title.length > 255) {
      errors.title = 'Title must be under 255 characters.';
    }

    if (!contentHtml.trim() || contentHtml === '<p><br></p>') {
      errors.content = 'Page content cannot be empty.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit and save content
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast('Please review the form validation errors.', 'error');
      return;
    }

    try {
      setSaving(true);
      setSuccessMsg('');
      setErrorMsg('');

      const response = await api.put(`/admin/cms/${slug}`, {
        title: title,
        content_html: contentHtml
      });

      const message = 'CMS Page Content successfully stored and published to the live platform!';
      setSuccessMsg(message);
      toast(message, 'success');
      setPageData(response.data.page);

      // Auto-clear success message after 4s
      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);

    } catch (err) {
      console.error('Failed to save CMS page', err);
      const serverMessage = err.response?.data?.message || 'A network error occurred while compiling your update.';
      setErrorMsg(serverMessage);
      toast(serverMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || fetching) {
    return (
      <div className="flex-grow flex items-center justify-center p-12 min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <span className="text-xs text-[var(--muted)] font-mono uppercase tracking-widest font-bold">
            Acquiring Document Schema...
          </span>
        </div>
      </div>
    );
  }

  if (!user || (!hasRole('super_admin') && !hasRole('admin') && !hasPermission('settings.manage'))) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start space-x-4 animate-in fade-in slide-in-from-bottom-4">
        <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Access Restricted</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            You must possess administrative or settings manager privileges to update official platform documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      <title>{`Update ${activePageInfo.name}  - ScholarlyNest`}</title>

      {/* Workspace Navigation Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80">
        <Link href="/admin" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Overview
        </Link>
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
          <span>Console</span>
          <span>/</span>
          <span>CMS</span>
          <span>/</span>
          <span className="text-[var(--accent-gold)]">{slug}</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-200/80 shadow-md relative overflow-hidden bg-white">
        <div className="absolute top-0 left-0 w-2 h-full bg-[var(--accent-gold)]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-gold)]">
          Academic Content Controller
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 mt-2">
          Update {activePageInfo.name}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
          {activePageInfo.description}
        </p>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="flex items-start space-x-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide">Update Deployed Successfully</h4>
            <p className="text-xs mt-1 font-medium">{successMsg}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-start space-x-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide">Compilation Failure</h4>
            <p className="text-xs mt-1 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Editor Panel Form */}
      <form onSubmit={handleSave} className="space-y-6">

        {/* Title Input Grid */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Document Header Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (validationErrors.title) {
                setValidationErrors(prev => ({ ...prev, title: '' }));
              }
            }}
            placeholder="e.g. Terms of Service & Open Registry"
            className={`w-full px-4 py-3 rounded-xl border bg-white text-zinc-900 text-sm font-medium focus:ring-2 focus:ring-[var(--accent)]/20 transition-all ${validationErrors.title ? 'border-red-500 focus:border-red-500' : 'border-zinc-200/80 focus:border-[var(--accent)]'
              }`}
          />
          {validationErrors.title && (
            <p className="text-[11px] font-semibold text-red-500 flex items-center">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              {validationErrors.title}
            </p>
          )}
        </div>

        {/* Workspace Toolbar Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Editorial Content Area
          </label>

          {/* Dual-Mode Toggle Switch */}
          <div className="inline-flex rounded-xl p-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setEditorMode('visual')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${editorMode === 'visual'
                ? 'bg-white shadow text-[var(--accent)]'
                : 'text-zinc-500 hover:text-zinc-800'
                }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Visual Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('html')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${editorMode === 'html'
                ? 'bg-white shadow text-[var(--accent)]'
                : 'text-zinc-500 hover:text-zinc-800'
                }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Raw HTML Markup</span>
            </button>
          </div>
        </div>

        {/* Interactive Editor Workspace */}
        <div className="relative">
          {editorMode === 'visual' ? (
            <div className="animate-in fade-in duration-200">
              <RichEditor
                value={contentHtml}
                onChange={(content) => {
                  setContentHtml(content);
                  if (validationErrors.content) {
                    setValidationErrors(prev => ({ ...prev, content: '' }));
                  }
                }}
                placeholder={`Start drafting your official ${activePageInfo.name} protocols here...`}
              />
            </div>
          ) : (
            <div className="animate-in fade-in duration-200">
              <textarea
                value={contentHtml}
                onChange={(e) => {
                  setContentHtml(e.target.value);
                  if (validationErrors.content) {
                    setValidationErrors(prev => ({ ...prev, content: '' }));
                  }
                }}
                placeholder="<!-- Add custom HTML blocks here -->"
                rows={16}
                style={{ color: '#ffffff' }}
                className={`w-full font-mono text-xs p-4 bg-zinc-900 text-white rounded-xl border focus:ring-2 focus:ring-[var(--accent)]/20 transition-all ${validationErrors.content ? 'border-red-500 focus:border-red-500' : 'border-zinc-800 focus:border-[var(--accent)]'
                  }`}
              />
            </div>
          )}

          {validationErrors.content && (
            <p className="text-[11px] font-semibold text-red-500 flex items-center mt-2">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              {validationErrors.content}
            </p>
          )}
        </div>

        {/* Footer Submissions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
          <Link href="/admin">
            <Button type="button" variant="ghost" size="md">
              Discard Changes
            </Button>
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="shadow-md bg-[var(--accent)] text-white hover:bg-[var(--accent)]/95 hover:scale-[1.02] transition-transform flex items-center space-x-2"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deploying Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Publish Update</span>
              </>
            )}
          </Button>
        </div>

      </form>

    </div>
  );
}
