'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  ArrowLeft, FileText, Check, Loader2, AlertCircle, 
  Code, Edit3, Save, ChevronRight, BookOpen, Upload, Tag as TagIcon, X 
} from 'lucide-react';
import api from '../../../../../utils/api';
import { useToast } from '../../../../../context/ToastContext';

const RichEditor = dynamic(() => import('../../../../../components/ui/RichEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8 bg-zinc-50 border border-zinc-200 rounded-xl">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      <span className="ml-3 text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Loading Editor Workspace...</span>
    </div>
  )
});

export default function AdminEditArticle() {
  const params = useParams();
  const id = params ? params.id : null;
  const router = useRouter();
  const { toast } = useToast();

  const [magazines, setMagazines] = useState([]);
  const [loadingMagazines, setLoadingMagazines] = useState(true);
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [magazineId, setMagazineId] = useState('');
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [fullText, setFullText] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [existingPdfPath, setExistingPdfPath] = useState('');
  const [status, setStatus] = useState('pending');

  // Editor modes ('visual' | 'html')
  const [abstractMode, setAbstractMode] = useState('visual');
  const [fullTextMode, setFullTextMode] = useState('visual');

  // Tags/Keywords State
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loadingTags, setLoadingTags] = useState(false);

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // 1. Fetch Magazines list
  useEffect(() => {
    const fetchMagazinesList = async () => {
      try {
        setLoadingMagazines(true);
        const response = await api.get('/magazines');
        setMagazines(response.data);
      } catch (err) {
        console.error(err);
        toast('Failed to load magazines list.', 'error');
      } finally {
        setLoadingMagazines(false);
      }
    };
    fetchMagazinesList();
  }, []);

  // 2. Fetch Article details
  useEffect(() => {
    if (!id) return;
    const fetchArticleDetails = async () => {
      try {
        setLoadingArticle(true);
        setError(null);
        const response = await api.get(`/admin/articles/${id}`);
        const article = response.data;
        
        setTitle(article.title);
        setMagazineId(article.magazine_id.toString());
        setAbstract(article.abstract);
        setFullText(article.full_text);
        setExistingPdfPath(article.pdf_path || '');
        setStatus(article.status);

        // Prepopulate tags (IDs and name strings if any mismatch)
        if (article.tags && Array.isArray(article.tags)) {
          setSelectedTags(article.tags.map(t => t.id));
        }
      } catch (err) {
        console.error(err);
        setError('Could not download the requested article details.');
      } finally {
        setLoadingArticle(false);
      }
    };
    fetchArticleDetails();
  }, [id]);

  // 3. Fetch Tags when magazine changes
  useEffect(() => {
    if (!magazineId) return;
    const fetchMagazineTags = async () => {
      try {
        setLoadingTags(true);
        const response = await api.get(`/tags?magazine_id=${magazineId}`);
        setAvailableTags(response.data);
        // Note: we don't automatically reset selectedTags here on initial load,
        // but if the magazine changes from the article's original, we clear it.
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTags(false);
      }
    };
    fetchMagazineTags();
  }, [magazineId]);

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
      
      const formData = new FormData();
      // Laravel method override for multipart PUT request
      formData.append('_method', 'PUT');
      formData.append('magazine_id', magazineId);
      formData.append('title', title);
      formData.append('abstract', abstract);
      formData.append('full_text', fullText);
      formData.append('status', status);
      if (pdfFile) {
        formData.append('pdf_file', pdfFile);
      }
      formData.append('tags', JSON.stringify(selectedTags));

      await api.post(`/admin/articles/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast('Article updated successfully.', 'success');
      router.push('/admin/articles');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to update the article.';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loadingArticle) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Downloading Article details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12">
        <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-150 rounded-xl text-red-700 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-xs leading-none">{error}</span>
        </div>
        <Link href="/admin/articles" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-[var(--accent)]">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Articles
        </Link>
      </div>
    );
  }

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
          <span className="text-zinc-650">Edit Article</span>
        </div>
      </div>

      {/* Hero card details */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-2">
        <h1 className="text-xl font-bold text-zinc-950 font-serif">Edit Article Workspace</h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">Modify publication details, update visual/HTML abstracts, compile documents, and manage metadata categories.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row Grid: Magazine, Status & Title */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1 md:col-span-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Target Magazine *</label>
            {loadingMagazines ? (
              <div className="flex items-center space-x-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-450 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
                <span>Loading issues...</span>
              </div>
            ) : (
              <select
                value={magazineId}
                onChange={(e) => {
                  setMagazineId(e.target.value);
                  setSelectedTags([]); // Clear tags if issue changed
                }}
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

          <div className="space-y-1 md:col-span-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Article Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 transition-colors"
            >
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
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
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Replace PDF Document (Optional)</label>
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
            {existingPdfPath && (
              <p className="text-[10px] text-emerald-600 font-bold font-mono">✓ Active PDF Link: {existingPdfPath}</p>
            )}
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
                <span>Updating Article...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Update Article</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
