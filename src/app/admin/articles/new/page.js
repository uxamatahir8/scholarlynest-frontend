'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  ArrowLeft, FileText, Check, Loader2, AlertCircle, 
  Code, Edit3, Save, ChevronRight, BookOpen, Upload, Tag as TagIcon, X, Eye
} from 'lucide-react';
import api from '../../../../utils/api';
import { useToast } from '../../../../context/ToastContext';
import { useAuth } from '../../../../context/AuthContext';
import CoAuthorRepeater from '../../../../components/article/CoAuthorRepeater';
import ArticleAssetBufferedDropzone from '../../../../components/article/ArticleAssetBufferedDropzone';

const RichEditor = dynamic(() => import('../../../../components/ui/RichEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8 bg-zinc-50 border border-zinc-200 rounded-xl">
      <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      <span className="ml-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Loading Editor Workspace...</span>
    </div>
  )
});

export default function AdminNewArticle() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, hasPermission, hasRole } = useAuth();
  const isSuperAdmin = hasRole ? hasRole('super_admin') : false;
  const canEditSeo = hasPermission ? hasPermission('seo.articles') : false;
  const canAutoApprove = hasPermission ? hasPermission('articles.auto-approve') : false;

  const [coAuthors, setCoAuthors] = useState([]);
  const [magazines, setMagazines] = useState([]);
  const [loadingMagazines, setLoadingMagazines] = useState(true);
  const [supplementaryFiles, setSupplementaryFiles] = useState([]);
  const [savingStatus, setSavingStatus] = useState('');

  // Form states
  const [magazineId, setMagazineId] = useState('');
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [fullText, setFullText] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [featuredImage, setFeaturedImage] = useState(null);
  const [featuredImageFileName, setFeaturedImageFileName] = useState('');
  const [featuredImagePreview, setFeaturedImagePreview] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);

  useEffect(() => {
    if (canAutoApprove) {
      setAutoApprove(true);
    } else {
      setAutoApprove(false);
    }
  }, [canAutoApprove]);

  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoExpanded, setSeoExpanded] = useState(false);

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
        const response = await api.get('/magazines', { params: { all: true } });
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

  const handleFeaturedImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast('Please upload a valid image file (PNG, JPG, WebP, etc.).', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast('Image file size must be less than 5MB.', 'error');
        return;
      }
      setFeaturedImage(file);
      setFeaturedImageFileName(file.name);
      setFeaturedImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveFeaturedImage = () => {
    setFeaturedImage(null);
    setFeaturedImageFileName('');
    setFeaturedImagePreview('');
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

    if (isSuperAdmin) {
      const validAuthors = coAuthors.filter(
        a => a.name.trim() && a.email.trim()
      );
      if (validAuthors.length === 0) {
        errors.coAuthors = 'As a super admin, you must add at least one author with name and email.';
      }
    }

    const hasSelfEmail = coAuthors.some(
      author => author.email.trim().toLowerCase() === user?.email?.trim().toLowerCase()
    );
    if (hasSelfEmail) {
      toast('You cannot list yourself as a co-author.', 'error');
      errors.coAuthors = 'Primary author cannot be listed as a co-author.';
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
      setSavingStatus('Saving Manuscript...');
      
      const formData = new FormData();
      formData.append('magazine_id', magazineId);
      formData.append('title', title);
      formData.append('abstract', abstract);
      formData.append('full_text', fullText);
      if (pdfFile) {
        formData.append('pdf_file', pdfFile);
      }
      if (featuredImage) {
        formData.append('featured_image', featuredImage);
      }
      formData.append('tags', JSON.stringify(selectedTags));
      formData.append('co_authors', JSON.stringify(coAuthors));
      if (canEditSeo) {
        formData.append('seo_title', seoTitle);
        formData.append('seo_description', seoDescription);
        formData.append('seo_keywords', seoKeywords);
      }

      const response = await api.post('/articles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const newArticle = response.data.article;

      // Upload supplementary assets if any
      if (newArticle && newArticle.id && supplementaryFiles.length > 0) {
        let uploadFailedCount = 0;
        for (let i = 0; i < supplementaryFiles.length; i++) {
          const file = supplementaryFiles[i];
          setSavingStatus(`Uploading asset ${i + 1} of ${supplementaryFiles.length}: ${file.name}...`);
          try {
            const assetFormData = new FormData();
            assetFormData.append('file', file);
            await api.post(`/articles/${newArticle.id}/assets`, assetFormData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
          } catch (uploadErr) {
            console.error('Failed to upload asset', file.name, uploadErr);
            uploadFailedCount++;
            toast(`Failed to upload supplementary asset: ${file.name}`, 'error');
          }
        }

        if (uploadFailedCount > 0) {
          toast(`Article created, but ${uploadFailedCount} supplementary asset(s) failed to upload.`, 'warning');
          router.push(`/admin/articles/${newArticle.id}/edit`);
          return;
        }
      }

      if (autoApprove && newArticle && newArticle.id) {
        setSavingStatus('Approving and compiling PDF...');
        await api.patch(`/admin/articles/${newArticle.id}/review`, {
          status: 'approved'
        });
        toast('Article created, accepted, and PDF compiled successfully!', 'success');
      } else {
        toast('Article created successfully and is now submitted for review.', 'success');
      }

      router.push('/admin/articles');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to submit the article.';
      toast(msg, 'error');
    } finally {
      setSaving(false);
      setSavingStatus('');
    }
  };

  return (
    <div className="space-y-8 w-full font-sans text-left">
      {/* Navigation breadcrumb */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-900">
        <Link href="/admin/articles" className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-zinc-405 hover:text-amber-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Articles
        </Link>
        <div className="flex items-center space-x-2 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
          <span>Console</span>
          <ChevronRight className="w-3 h-3 text-amber-500" />
          <span>Articles</span>
          <ChevronRight className="w-3 h-3 text-amber-500" />
          <span className="text-zinc-800 dark:text-zinc-200">New Article</span>
        </div>
      </div>

      {/* Intro section */}
      <div className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-2">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Publish New Article</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">Draft dynamic HTML abstracts, upload pre-compiled PDFs, and configure co-authors permission settings.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Magazine Selector & Title field */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Select Magazine *</label>
            {loadingMagazines ? (
              <div className="flex items-center space-x-2 px-3 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-400 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>Loading issues...</span>
              </div>
            ) : (
              <select
                value={magazineId}
                onChange={(e) => setMagazineId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-200 cursor-pointer"
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

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Article Title *</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Advancements in Deep Neural Network Optimizations"
              className="w-full text-xs font-semibold px-3 py-3 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-200"
            />
            {validationErrors.title && (
              <p className="text-[10px] font-semibold text-red-500">{validationErrors.title}</p>
            )}
          </div>
        </div>

        {/* Co-Authors panel */}
        <div className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-zinc-100 dark:border-zinc-850 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-serif">Collaborators & Permissions</h3>
            <p className="text-[10px] text-zinc-400 mt-1 font-semibold leading-relaxed">Map editing privileges and coordinate account provisioning gates for co-authors.</p>
          </div>
          <CoAuthorRepeater 
            coAuthors={coAuthors}
            setCoAuthors={setCoAuthors}
            currentUserEmail={user?.email}
            required={isSuperAdmin}
          />
          {validationErrors.coAuthors && (
            <p className="text-[10px] font-semibold text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-550" />{validationErrors.coAuthors}
            </p>
          )}
        </div>

        {/* Tags / Keywords Selection */}
        <div className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Keywords & Tag Indices</label>
            <span className="text-[10px] text-zinc-400 font-medium">Select tags associated with this magazine or submit custom terms.</span>
          </div>

          {loadingTags ? (
            <div className="flex items-center space-x-2 text-xs text-zinc-450 font-semibold py-1">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>Syncing tags database...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {availableTags.length > 0 && (
                <div className="space-y-2">
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
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' 
                              : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-600 border-zinc-200 hover:border-amber-500/20 hover:bg-amber-500/[0.01] dark:border-zinc-800'
                          }`}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add Custom keyword */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-zinc-455 uppercase tracking-wider block font-mono">Add Custom Keyword</span>
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
                    className="flex-grow text-xs font-semibold px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-505 transition-colors text-zinc-900 dark:text-zinc-200"
                  />
                  <button
                    type="button"
                    onClick={addCustomKeyword}
                    className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 rounded-xl transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Custom tags queue */}
              {selectedTags.some(t => typeof t === 'string') && (
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Custom Keywords</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTags.filter(t => typeof t === 'string').map((keyword, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-500/[0.04] text-amber-700 dark:text-amber-400 border border-amber-500/20"
                      >
                        <span>{keyword}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedTags(selectedTags.filter(t => t !== keyword))}
                          className="hover:text-red-650 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
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
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
              Abstract Synopsis *
            </label>

            {/* Abstract Visual / HTML selector */}
            <div className="flex items-center space-x-3 text-[10px] font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setAbstractMode('visual')}
                className={`transition-colors cursor-pointer ${
                  abstractMode === 'visual'
                    ? 'text-amber-600 border-b-2 border-amber-500 pb-0.5'
                    : 'text-zinc-400 hover:text-zinc-900'
                }`}
              >
                Visual Editor
              </button>
              <span className="text-zinc-200 dark:text-zinc-800">|</span>
              <button
                type="button"
                onClick={() => setAbstractMode('html')}
                className={`transition-colors cursor-pointer ${
                  abstractMode === 'html'
                    ? 'text-amber-600 border-b-2 border-amber-500 pb-0.5'
                    : 'text-zinc-400 hover:text-zinc-900'
                }`}
              >
                Raw HTML
              </button>
            </div>
          </div>

          <div className="min-h-[200px] flex flex-col relative">
            {abstractMode === 'visual' ? (
              <div className="flex-grow flex flex-col relative">
                <RichEditor
                  value={abstract}
                  onChange={(content) => setAbstract(content)}
                  placeholder="Enter manuscript abstract synopsis..."
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
                  className="w-full flex-grow font-mono text-xs p-4 bg-zinc-900 text-white border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
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
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
              Full Text Content *
            </label>

            {/* Content selector visual/html */}
            <div className="flex items-center space-x-3 text-[10px] font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setFullTextMode('visual')}
                className={`transition-colors cursor-pointer ${
                  fullTextMode === 'visual'
                    ? 'text-amber-600 border-b-2 border-amber-500 pb-0.5'
                    : 'text-zinc-400 hover:text-zinc-900'
                }`}
              >
                Visual Editor
              </button>
              <span className="text-zinc-200 dark:text-zinc-800">|</span>
              <button
                type="button"
                onClick={() => setFullTextMode('html')}
                className={`transition-colors cursor-pointer ${
                  fullTextMode === 'html'
                    ? 'text-amber-600 border-b-2 border-amber-500 pb-0.5'
                    : 'text-zinc-400 hover:text-zinc-900'
                }`}
              >
                Raw HTML
              </button>
            </div>
          </div>

          <div className="min-h-[300px] flex flex-col relative">
            {fullTextMode === 'visual' ? (
              <div className="flex-grow flex flex-col relative">
                <RichEditor
                  value={fullText}
                  onChange={(content) => setFullText(content)}
                  placeholder="Draft full manuscript contents..."
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
                  className="w-full flex-grow font-mono text-xs p-4 bg-zinc-900 text-white border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}
            {validationErrors.fullText && (
              <p className="text-[10px] font-semibold text-red-500 mt-1">{validationErrors.fullText}</p>
            )}
          </div>
        </div>

        {/* Upload Panels: PDF & Image cover */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-200 dark:border-zinc-900">
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Pre-compiled PDF Document (Optional)</label>
            <div className="flex items-center space-x-3 font-sans">
              <label className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-350 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800 cursor-pointer shadow-sm">
                <Upload className="w-4 h-4" />
                <span>Choose PDF</span>
                <input 
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-zinc-450 font-mono font-medium truncate max-w-xs">{pdfFileName || 'No file chosen'}</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">If no PDF is uploaded, a beautifully formatted catalog PDF will be dynamically compiled upon approval.</p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Cover / Header Image (Optional)</label>
            <div className="flex flex-col space-y-3 font-sans">
              <div className="flex items-center space-x-3">
                <label className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-350 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800 cursor-pointer shadow-sm">
                  <Upload className="w-4 h-4" />
                  <span>Choose Image</span>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleFeaturedImageChange}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-zinc-450 font-mono font-medium truncate max-w-xs">{featuredImageFileName || 'No image chosen'}</span>
              </div>
              {featuredImagePreview && (
                <div className="relative w-full max-w-[200px] h-32 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-850 shadow-sm bg-zinc-50">
                  <img src={featuredImagePreview} alt="Cover Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveFeaturedImage}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-zinc-950/70 hover:bg-zinc-950 text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">Featured cover image. Falls back to magazine cover if blank.</p>
          </div>

          {canAutoApprove && (
            <div className="md:col-span-2 flex items-center space-x-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-850 self-start">
              <input 
                type="checkbox"
                id="autoApprove"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div className="space-y-0.5 select-none cursor-pointer text-left" onClick={() => setAutoApprove(!autoApprove)}>
                <label htmlFor="autoApprove" className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider block cursor-pointer">Auto-Approve manuscript immediately</label>
                <span className="text-[10px] text-zinc-400 font-medium block leading-relaxed">Instantly publish to public archive registries and compile dynamic PDF assets.</span>
              </div>
            </div>
          )}
        </div>

        {/* Article Assets Manager */}
        <div className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-4">
          <ArticleAssetBufferedDropzone
            files={supplementaryFiles}
            onFilesChanged={setSupplementaryFiles}
          />
        </div>

        {/* Collapsible SEO block */}
        {canEditSeo && (
          <div className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-4">
            <button
              type="button"
              onClick={() => setSeoExpanded(!seoExpanded)}
              className="w-full flex items-center justify-between font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <span className="flex items-center space-x-2 text-xs uppercase tracking-wider text-zinc-500 font-mono">
                <TagIcon className="w-4 h-4 text-amber-500" />
                <span>SEO & Meta Configuration</span>
              </span>
              <span className="text-[10px] font-bold text-amber-600 font-mono uppercase tracking-wider">
                {seoExpanded ? 'Hide' : 'Show Settings'}
              </span>
            </button>

            {seoExpanded && (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850 space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">SEO Meta Title</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Article Title | Magazine Title"
                    maxLength={255}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-200"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Meta Description</label>
                    <span className="text-[10px] font-semibold text-zinc-400 font-mono">
                      {seoDescription.length}/500
                    </span>
                  </div>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value.slice(0, 500))}
                    placeholder="Provide keywords description summary..."
                    rows={3}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Meta Keywords</label>
                  <input
                    type="text"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    placeholder="optimizations, deep learning, networks"
                    maxLength={500}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-505 transition-colors text-zinc-900 dark:text-zinc-200"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit workspace buttons */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-zinc-150 dark:border-zinc-900">
          <Link 
            href="/admin/articles"
            className="px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 hover:bg-zinc-150 transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{savingStatus || 'Publishing Manuscript...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Manuscript</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
