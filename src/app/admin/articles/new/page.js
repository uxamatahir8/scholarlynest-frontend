'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  ArrowLeft, FileText, Check, Loader2, AlertCircle, 
  Code, Edit3, Save, ChevronRight, BookOpen, Upload, Tag as TagIcon, X 
} from 'lucide-react';
import api from '../../../../utils/api';
import { useToast } from '../../../../context/ToastContext';

const RichEditor = dynamic(() => import('../../../../components/ui/RichEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8 bg-zinc-50 border border-zinc-200 rounded-xl">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      <span className="ml-3 text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Loading Editor Workspace...</span>
    </div>
  )
});

export default function AdminNewArticle() {
  const router = useRouter();
  const { toast } = useToast();

  const [magazines, setMagazines] = useState([]);
  const [loadingMagazines, setLoadingMagazines] = useState(true);

  // Form states
  const [magazineId, setMagazineId] = useState('');
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [fullText, setFullText] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [autoApprove, setAutoApprove] = useState(true);

  // Editor modes ('visual' | 'html')
  const [abstractMode, setAbstractMode] = useState('visual');
  const [fullTextMode, setFullTextMode] = useState('visual');

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Tags/Keywords State
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loadingTags, setLoadingTags] = useState(false);

  useEffect(() => {
    const fetchMagazinesList = async () => {
      try {
        setLoadingMagazines(true);
        const response = await api.get('/magazines');
        setMagazines(response.data);
        if (response.data.length > 0) {
          setMagazineId(response.data[0].id.toString());
        }
      } catch (err) {
        console.error(err);
        toast('Failed to load magazines list.', 'error');
      } finally {
        setLoadingMagazines(false);
      }
    };
    fetchMagazinesList();
  }, []);

  // Fetch Tags when magazine changes
  useEffect(() => {
    if (!magazineId) return;
    const fetchMagazineTags = async () => {
      try {
        setLoadingTags(true);
        const response = await api.get(`/tags?magazine_id=${magazineId}`);
        setAvailableTags(response.data);
        setSelectedTags([]); // Reset selection when magazine changes
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTags(false);
      }
    };
    fetchMagazineTags();
  }, [magazineId]);

  const addCustomKeyword = () => {
    const val = newKeyword.trim();
    if (!val) return;

    const alreadySelected = selectedTags.some(t => {
      if (typeof t === 'string') {
        return t.toLowerCase() === val.toLowerCase();
      } else {
        const matchedTag = availableTags.find(at => at.id === t);
        return matchedTag && matchedTag.name.toLowerCase() === val.toLowerCase();
      }
    });

    if (alreadySelected) {
      toast('Keyword is already selected.', 'error');
      return;
    }

    const matchedAvailable = availableTags.find(at => at.name.toLowerCase() === val.toLowerCase());
    if (matchedAvailable) {
      setSelectedTags([...selectedTags, matchedAvailable.id]);
    } else {
      setSelectedTags([...selectedTags, val]);
    }
    setNewKeyword('');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast('Please upload a valid PDF file.', 'error');
        return;
      }
      setPdfFile(file);
      setPdfFileName(file.name);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!magazineId) {
      errors.magazineId = 'Please select a magazine.';
    }
    if (!title.trim()) {
      errors.title = 'Article title is required.';
    }
    if (!abstract.trim() || abstract === '<p><br></p>') {
      errors.abstract = 'Article abstract is required.';
    }
    if (!fullText.trim() || fullText === '<p><br></p>') {
      errors.fullText = 'Article full text is required.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast('Please review the validation errors.', 'error');
      return;
    }

    try {
      setSaving(true);
      
      // Use FormData to support file upload
      const formData = new FormData();
      formData.append('magazine_id', magazineId);
      formData.append('title', title);
      formData.append('abstract', abstract);
      formData.append('full_text', fullText);
      if (pdfFile) {
        formData.append('pdf_file', pdfFile);
      }
      formData.append('tags', JSON.stringify(selectedTags));

      const response = await api.post('/articles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const newArticle = response.data.article;

      // If auto-approve is checked, call review endpoint immediately
      if (autoApprove && newArticle && newArticle.id) {
        await api.patch(`/admin/articles/${newArticle.id}/review`, {
          status: 'approved'
        });
        toast('Article created, approved, and PDF compiled successfully!', 'success');
      } else {
        toast('Article created successfully and is now pending review.', 'success');
      }

      router.push('/admin/articles');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to submit the article.';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigation Headers */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <Link href="/admin/articles" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-[var(--accent)] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Articles
        </Link>
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <span>Console</span>
          <ChevronRight className="w-3 h-3 text-[var(--accent-gold)]" />
          <span>Articles</span>
          <ChevronRight className="w-3 h-3 text-[var(--accent-gold)]" />
          <span className="text-zinc-650">New Article</span>
        </div>
      </div>

      {/* Hero card details */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-2">
        <h1 className="text-xl font-bold text-zinc-950">Add Article to Magazine</h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">Submit a new publication directly. You can write abstracts and full texts, upload pre-compiled PDFs, and toggle immediate status approval.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row Grid: Magazine & Title */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1 md:col-span-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Select Magazine *</label>
            {loadingMagazines ? (
              <div className="flex items-center space-x-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-450 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
                <span>Loading issues...</span>
              </div>
            ) : (
              <select
                value={magazineId}
                onChange={(e) => setMagazineId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 transition-colors"
              >
                {magazines.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            )}
            {validationErrors.magazineId && (
              <p className="text-[10px] font-semibold text-red-500">{validationErrors.magazineId}</p>
            )}
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Article Title *</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Advancements in Deep Neural Network Optimizations"
              className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 transition-colors"
            />
            {validationErrors.title && (
              <p className="text-[10px] font-semibold text-red-500">{validationErrors.title}</p>
            )}
          </div>
        </div>

        {/* Keywords & Tags Selection Panel */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Article Keywords & Tags</label>
            <span className="text-[10px] text-zinc-400 font-medium">Select tags associated with this magazine or enter new ones below.</span>
          </div>

          {loadingTags ? (
            <div className="flex items-center space-x-2 text-xs text-zinc-450 font-semibold py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
              <span>Loading magazine tags...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {availableTags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-wider block font-mono">Available Tags (Click to toggle)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTags(selectedTags.filter(id => id !== tag.id));
                            } else {
                              setSelectedTags([...selectedTags, tag.id]);
                            }
                          }}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30' 
                              : 'bg-zinc-50 text-zinc-650 border-zinc-200 hover:border-zinc-350'
                          }`}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add Custom keyword input */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-wider block font-mono">Add Custom Keyword</span>
                <div className="flex items-center space-x-2 max-w-md">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomKeyword();
                      }
                    }}
                    placeholder="Type keyword and press Enter..."
                    className="flex-grow text-xs font-semibold px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={addCustomKeyword}
                    className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-zinc-800 hover:bg-zinc-950 rounded-lg transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Selected custom keyword tags list */}
              {selectedTags.some(t => typeof t === 'string') && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-wider block font-mono">Custom Keywords</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTags.filter(t => typeof t === 'string').map((keyword, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-[var(--accent-gold)]/10 text-amber-800 border border-[var(--accent-gold)]/30"
                      >
                        <span>{keyword}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedTags(selectedTags.filter(t => t !== keyword))}
                          className="hover:text-red-750 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Abstract Box */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Abstract Synopsis *
            </label>

            {/* Abstract Toggler */}
            <div className="inline-flex rounded-xl p-1 bg-zinc-100 border border-zinc-200/50">
              <button
                type="button"
                onClick={() => setAbstractMode('visual')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  abstractMode === 'visual'
                    ? 'bg-white shadow text-[var(--accent)]'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Visual</span>
              </button>
              <button
                type="button"
                onClick={() => setAbstractMode('html')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  abstractMode === 'html'
                    ? 'bg-white shadow text-[var(--accent)]'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>HTML</span>
              </button>
            </div>
          </div>

          <div className="min-h-[200px] flex flex-col relative">
            {abstractMode === 'visual' ? (
              <div className="flex-grow flex flex-col relative">
                <RichEditor
                  value={abstract}
                  onChange={(content) => setAbstract(content)}
                  placeholder="Enter abstract text..."
                />
              </div>
            ) : (
              <div className="flex-grow flex flex-col relative">
                <textarea
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  placeholder="<!-- Abstract HTML content -->"
                  rows={6}
                  style={{ color: '#ffffff' }}
                  className="w-full flex-grow font-mono text-xs p-4 bg-zinc-900 text-white border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            )}
            {validationErrors.abstract && (
              <p className="text-[10px] font-semibold text-red-500 mt-1">{validationErrors.abstract}</p>
            )}
          </div>
        </div>

        {/* Full Text Box */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Full Text Content *
            </label>

            {/* Full Text Toggler */}
            <div className="inline-flex rounded-xl p-1 bg-zinc-100 border border-zinc-200/50">
              <button
                type="button"
                onClick={() => setFullTextMode('visual')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  fullTextMode === 'visual'
                    ? 'bg-white shadow text-[var(--accent)]'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Visual</span>
              </button>
              <button
                type="button"
                onClick={() => setFullTextMode('html')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  fullTextMode === 'html'
                    ? 'bg-white shadow text-[var(--accent)]'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>HTML</span>
              </button>
            </div>
          </div>

          <div className="min-h-[300px] flex flex-col relative">
            {fullTextMode === 'visual' ? (
              <div className="flex-grow flex flex-col relative">
                <RichEditor
                  value={fullText}
                  onChange={(content) => setFullText(content)}
                  placeholder="Enter full text content..."
                />
              </div>
            ) : (
              <div className="flex-grow flex flex-col relative">
                <textarea
                  value={fullText}
                  onChange={(e) => setFullText(e.target.value)}
                  placeholder="<!-- Full Text HTML content -->"
                  rows={12}
                  style={{ color: '#ffffff' }}
                  className="w-full flex-grow font-mono text-xs p-4 bg-zinc-900 text-white border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            )}
            {validationErrors.fullText && (
              <p className="text-[10px] font-semibold text-red-500 mt-1">{validationErrors.fullText}</p>
            )}
          </div>
        </div>

        {/* PDF File upload & Auto Approve */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-200">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Pre-compiled PDF Document (Optional)</label>
            <div className="flex items-center space-x-3">
              <label className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer border border-zinc-300">
                <Upload className="w-4 h-4" />
                <span>Choose PDF</span>
                <input 
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-zinc-500 font-mono font-medium truncate max-w-xs">{pdfFileName || 'No file selected'}</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">If no pre-compiled PDF is uploaded, a custom, beautifully formatted PDF document will be dynamically compiled upon approval.</p>
          </div>

          <div className="flex items-center space-x-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/60 self-start">
            <input 
              type="checkbox"
              id="autoApprove"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
            />
            <div className="space-y-0.5 select-none cursor-pointer" onClick={() => setAutoApprove(!autoApprove)}>
              <label htmlFor="autoApprove" className="text-xs font-bold text-zinc-950 uppercase tracking-wider block cursor-pointer">Auto-Approve & Compile PDF</label>
              <span className="text-[10px] text-zinc-400 font-medium block">Publish the article immediately to the public catalog and compile PDF layout assets.</span>
            </div>
          </div>
        </div>

        {/* Submit workspace buttons */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-zinc-200">
          <Link 
            href="/admin/articles"
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[var(--accent)] hover:bg-[var(--accent)]/95 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing Article...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Article</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
