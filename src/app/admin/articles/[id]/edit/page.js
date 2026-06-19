'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  ArrowLeft, FileText, Check, Loader2, AlertCircle, 
  Code, Edit3, Save, ChevronRight, BookOpen, Upload, Tag as TagIcon, X, Eye
} from 'lucide-react';
import api from '../../../../../utils/api';
import { useToast } from '../../../../../context/ToastContext';
import { useAuth } from '../../../../../context/AuthContext';
import CoAuthorRepeater from '../../../../../components/article/CoAuthorRepeater';
import ArticleAssetDropzone from '../../../../../components/article/ArticleAssetDropzone';
import {
  appendAcademicMetadata,
  currentUserAuthor,
  emptyAcademicMetadata,
  normalizeAuthorRows,
  validateAuthors,
} from '../../../../../components/article/academicArticleForm';
import {
  EDITABLE_STATUS_OPTIONS,
  STATUS_LABELS,
} from '../../../../../components/admin/articleWorkflow';

const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('/images/') || path.startsWith('images/')) {
    return path.startsWith('/') ? path : '/' + path;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const domain = apiBase.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${domain}${cleanPath}`;
};

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
  const { user, hasRole, hasPermission } = useAuth();
  const isSuperAdmin = hasRole ? hasRole('super_admin') : false;

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
  const [featuredImage, setFeaturedImage] = useState(null);
  const [featuredImageFileName, setFeaturedImageFileName] = useState('');
  const [featuredImagePreview, setFeaturedImagePreview] = useState('');
  const [existingFeaturedImage, setExistingFeaturedImage] = useState('');
  const [deleteFeaturedImage, setDeleteFeaturedImage] = useState(false);
  const [status, setStatus] = useState('submitted');
  const [articleOwnerId, setArticleOwnerId] = useState(null);
  const [academicMetadata, setAcademicMetadata] = useState(emptyAcademicMetadata);
  const [revisionResponse, setRevisionResponse] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [savingSeo, setSavingSeo] = useState(false);

  const canEditAll = hasRole('super_admin') || hasRole('admin') || hasRole('editor') || (user && articleOwnerId === user.id && hasPermission('articles.edit-own'));
  const canEditSeo = hasPermission('seo.articles');
  const isRevisionCycle = ['revision_required', 'minor_revision_required', 'major_revision_required'].includes(status);

  // Expand SEO settings by default if user is SEO-only
  useEffect(() => {
    if (!canEditAll && canEditSeo) {
      setSeoExpanded(true);
    }
  }, [canEditAll, canEditSeo]);

  // Editor modes ('visual' | 'html')
  const [abstractMode, setAbstractMode] = useState('visual');
  const [fullTextMode, setFullTextMode] = useState('visual');

  // Tags/Keywords State
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loadingTags, setLoadingTags] = useState(false);

  const [saving, setSaving] = useState(false);
  const [assets, setAssets] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [coAuthors, setCoAuthors] = useState([]);

  const updateAcademicMetadata = (field, value) => {
    setAcademicMetadata((prev) => ({ ...prev, [field]: value }));
  };

  // 1. Fetch Magazines list
  useEffect(() => {
    const fetchMagazinesList = async () => {
      try {
        setLoadingMagazines(true);
        const response = await api.get('/magazines', { params: { all: true } });
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
        setExistingFeaturedImage(article.featured_image || '');
        setStatus(article.status);
        setArticleOwnerId(article.user_id);
        setAssets(article.assets || []);
        setAcademicMetadata({
          articleCategory: article.article_category || '',
          articleType: article.article_type || '',
          subjectArea: article.subject_area || '',
          language: article.language || 'English',
          ethicalApprovalStatement: article.ethical_approval_statement || '',
          conflictOfInterestStatement: article.conflict_of_interest_statement || '',
          fundingStatement: article.funding_statement || '',
          dataAvailabilityStatement: article.data_availability_statement || '',
          authorContributionStatement: article.author_contribution_statement || '',
        });

        setSeoTitle(article.seo_title || '');
        setSeoDescription(article.seo_description || '');
        setSeoKeywords(article.seo_keywords || '');

        // Prepopulate tags (IDs and name strings if any mismatch)
        if (article.tags && Array.isArray(article.tags)) {
          setSelectedTags(article.tags.map(t => t.id));
        }

        // Prepopulate co-authors
        if (article.article_authors && Array.isArray(article.article_authors)) {
          setCoAuthors(normalizeAuthorRows(article.article_authors.map(author => ({
            name: author.co_author_name,
            email: author.co_author_email,
            affiliation: author.affiliation || author.university_name || '',
            university_name: author.university_name || '',
            department: author.department || '',
            country: author.country || '',
            orcid: author.orcid || '',
            author_order: author.author_order || 1,
            is_owner: !!author.is_owner,
            is_corresponding: !!author.is_corresponding,
            contribution_statement: author.contribution_statement || '',
            can_edit: !!author.can_edit,
            create_account: !!author.account_provisioned || !!author.user_id
          }))));
        } else if (user && !isSuperAdmin) {
          setCoAuthors([currentUserAuthor(user)]);
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
      setDeleteFeaturedImage(false);
    }
  };

  const handleRemoveFeaturedImage = () => {
    setFeaturedImage(null);
    setFeaturedImageFileName('');
    setFeaturedImagePreview('');
    setDeleteFeaturedImage(true);
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

    Object.assign(errors, validateAuthors(coAuthors, { isSuperAdmin, user }));

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
      appendAcademicMetadata(formData, academicMetadata);
      if (pdfFile) {
        formData.append('pdf_file', pdfFile);
      }
      if (revisionResponse.trim()) {
        formData.append('revision_response', revisionResponse.trim());
      }
      if (changeSummary.trim()) {
        formData.append('change_summary', changeSummary.trim());
      }
      if (featuredImage) {
        formData.append('featured_image', featuredImage);
      }
      if (deleteFeaturedImage) {
        formData.append('delete_featured_image', 'true');
      }
      formData.append('tags', JSON.stringify(selectedTags));
      const normalizedAuthors = normalizeAuthorRows(coAuthors);
      formData.append('authors', JSON.stringify(normalizedAuthors));
      formData.append('co_authors', JSON.stringify(normalizedAuthors));
      if (canEditSeo) {
        formData.append('seo_title', seoTitle);
        formData.append('seo_description', seoDescription);
        formData.append('seo_keywords', seoKeywords);
      }

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

  const handleSaveSeoOnly = async (e) => {
    e.preventDefault();
    try {
      setSavingSeo(true);
      await api.patch(`/admin/articles/${id}/seo`, {
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords,
      });
      toast('Article SEO metadata updated successfully.', 'success');
      router.push('/admin/articles');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to update SEO metadata.';
      toast(msg, 'error');
    } finally {
      setSavingSeo(false);
    }
  };

  if (loadingArticle) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 font-sans text-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Downloading Article details...</span>
      </div>
    );
  }

  if (!user || (!canEditAll && !canEditSeo)) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-start space-x-4 max-w-xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4">
        <AlertCircle className="w-6 h-6 text-red-550 shrink-0" />
        <div className="text-left font-sans">
          <h3 className="text-sm font-bold text-red-750 dark:text-red-400">Access Restricted</h3>
          <p className="text-xs text-red-655 dark:text-red-300 mt-1 leading-relaxed">
            You must possess administrative, editing, or SEO privileges to access this article's workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full font-sans text-left">
      {/* Navigation Headers */}
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
          <span className="text-zinc-800 dark:text-zinc-200">Edit Article</span>
        </div>
      </div>

      {/* Hero card details */}
      <div className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-2">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Article Workspace</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">Modify publication details, update visual/HTML abstracts, compile documents, and manage metadata categories.</p>
      </div>

      {canEditAll ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row Grid: Magazine, Status & Title */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Target Magazine *</label>
              {loadingMagazines ? (
                <div className="flex items-center space-x-2 px-3 py-3.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-450 font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span>Loading issues...</span>
                </div>
              ) : (
                <select
                  value={magazineId}
                  onChange={(e) => {
                    setMagazineId(e.target.value);
                    setSelectedTags([]); // Clear tags if issue changed
                  }}
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

            <div className="space-y-1.5 md:col-span-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Article Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-200 cursor-pointer"
              >
                {!EDITABLE_STATUS_OPTIONS.some(option => option.value === status) && (
                  <option value={status}>{STATUS_LABELS[status] || status.replaceAll('_', ' ')}</option>
                )}
                {EDITABLE_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
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

          {/* Academic Metadata */}
          <div className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="border-b border-zinc-100 dark:border-zinc-850 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-serif">Academic Metadata</h3>
              <p className="text-[10px] text-zinc-400 mt-1 font-semibold leading-relaxed">Classify the manuscript and record required academic declarations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Article Type</label>
                <input value={academicMetadata.articleType} onChange={(e) => updateAcademicMetadata('articleType', e.target.value)} placeholder="Research Article" className="w-full text-xs font-semibold px-3 py-2.5 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-900 dark:text-zinc-200" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Category</label>
                <input value={academicMetadata.articleCategory} onChange={(e) => updateAcademicMetadata('articleCategory', e.target.value)} placeholder="Original Research" className="w-full text-xs font-semibold px-3 py-2.5 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-900 dark:text-zinc-200" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Subject Area</label>
                <input value={academicMetadata.subjectArea} onChange={(e) => updateAcademicMetadata('subjectArea', e.target.value)} placeholder="Biomedical Engineering" className="w-full text-xs font-semibold px-3 py-2.5 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-900 dark:text-zinc-200" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Language</label>
                <input value={academicMetadata.language} onChange={(e) => updateAcademicMetadata('language', e.target.value)} placeholder="English" className="w-full text-xs font-semibold px-3 py-2.5 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-900 dark:text-zinc-200" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ['ethicalApprovalStatement', 'Ethical Approval Statement'],
                ['conflictOfInterestStatement', 'Conflict of Interest Statement'],
                ['fundingStatement', 'Funding Statement'],
                ['dataAvailabilityStatement', 'Data Availability Statement'],
                ['authorContributionStatement', 'Author Contribution Statement'],
              ].map(([field, label]) => (
                <div key={field} className="space-y-1 md:last:col-span-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">{label}</label>
                  <textarea
                    value={academicMetadata[field]}
                    onChange={(e) => updateAcademicMetadata(field, e.target.value)}
                    rows={2}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-900 dark:text-zinc-200"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Author Metadata & Collaborators */}
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

          {/* Keywords & Tags Selection Panel */}
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
                                : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-650 border-zinc-200 hover:border-amber-500/20 hover:bg-amber-500/[0.01] dark:border-zinc-800'
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
                      className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-zinc-955 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 rounded-xl transition-all cursor-pointer shrink-0 shadow-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Selected custom keyword tags list */}
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

              {/* Abstract Toggler */}
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
                  Raw HTML Body
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

              {/* Full Text Toggler */}
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
                  Raw HTML Body
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
                    className="w-full flex-grow font-mono text-xs p-4 bg-zinc-900 text-white border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}
              {validationErrors.fullText && (
                <p className="text-[10px] font-semibold text-red-500 mt-1">{validationErrors.fullText}</p>
              )}
            </div>
          </div>

          {/* PDF File upload & Featured Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-200 dark:border-zinc-900">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Replace PDF Document (Optional)</label>
              <div className="flex items-center space-x-3">
                <label className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-350 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer shadow-sm">
                  <Upload className="w-4 h-4" />
                  <span>Choose PDF</span>
                  <input 
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-zinc-450 font-mono font-medium truncate max-w-xs">{pdfFileName || 'No file selected'}</span>
              </div>
              {existingPdfPath && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold font-mono">✓ Active PDF Link: {existingPdfPath}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Featured Image (Optional)</label>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-3">
                  <label className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-350 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>Choose Image</span>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleFeaturedImageChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-zinc-450 font-mono font-medium truncate max-w-xs">{featuredImageFileName || 'No image selected'}</span>
                </div>

                {/* Preview active featured image or new image preview */}
                {featuredImagePreview ? (
                  <div className="relative w-full max-w-[200px] h-32 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-850 shadow-sm bg-zinc-50 animate-in fade-in duration-300">
                    <img src={featuredImagePreview} alt="New Featured Image Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveFeaturedImage}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (existingFeaturedImage && !deleteFeaturedImage) ? (
                  <div className="relative w-full max-w-[200px] h-32 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-850 shadow-sm bg-zinc-50">
                    <img src={getFullImageUrl(existingFeaturedImage)} alt="Existing Featured" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveFeaturedImage}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 hover:bg-red-750 text-white transition-colors"
                      title="Remove Featured Image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
              <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">Add or replace the article cover image. Falls back to the magazine cover image if not provided.</p>
            </div>
          </div>

          {isRevisionCycle && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border border-amber-500/15 p-5 rounded-2xl">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 font-mono block">
                  Response to Reviewer / Editor Comments
                </label>
                <textarea
                  value={revisionResponse}
                  onChange={(e) => setRevisionResponse(e.target.value)}
                  rows={4}
                  placeholder="Explain how the requested revisions were addressed..."
                  className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-zinc-955 border border-amber-500/20 dark:border-amber-500/20 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 font-mono block">
                  Summary of Changes
                </label>
                <textarea
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  rows={4}
                  placeholder="Summarize the main manuscript changes in this revision..."
                  className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-zinc-955 border border-amber-500/20 dark:border-amber-500/20 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-200"
                />
              </div>
            </div>
          )}

          {/* Article Assets Manager */}
          <div className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-4">
            <ArticleAssetDropzone
              articleId={id}
              assets={assets}
              onAssetsChanged={setAssets}
            />
          </div>

          {/* Collapsible SEO Panel */}
          {canEditSeo && (
            <div className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-4">
              <button
                type="button"
                onClick={() => setSeoExpanded(!seoExpanded)}
                className="w-full flex items-center justify-between font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <span className="flex items-center space-x-2 text-xs uppercase tracking-wider text-zinc-500 font-mono">
                  <TagIcon className="w-4 h-4 text-amber-500" />
                  <span>SEO & Metadata Settings</span>
                </span>
                <span className="text-[10px] font-bold text-amber-600 font-mono uppercase tracking-wider">
                  {seoExpanded ? 'Hide' : 'Show Settings'}
                </span>
              </button>

              {seoExpanded && (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850 space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">SEO Title</label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="Leave blank to auto-generate (Article Title | Magazine Title)"
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
                      placeholder="Summarize the article content for search engines..."
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
                      placeholder="e.g. deep learning, optimizers, neural networks"
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
      ) : (
        <div className="space-y-6">
          {canEditSeo && (
            <div className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-850 pb-3">
                <span className="flex items-center space-x-2 text-xs uppercase tracking-wider text-zinc-500 font-mono">
                  <TagIcon className="w-4 h-4 text-amber-500" />
                  <span>SEO & Metadata Settings</span>
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">SEO Title</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Leave blank to auto-generate (Article Title | Magazine Title)"
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
                    placeholder="Summarize the article content for search engines..."
                    rows={4}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-505 transition-colors text-zinc-900 dark:text-zinc-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Meta Keywords</label>
                  <input
                    type="text"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    placeholder="e.g. deep learning, optimizers, neural networks"
                    maxLength={500}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-505 transition-colors text-zinc-900 dark:text-zinc-200"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveSeoOnly}
                    disabled={savingSeo}
                    className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm transition-colors cursor-pointer"
                  >
                    {savingSeo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating SEO...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Update SEO Metadata</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-zinc-150 dark:border-zinc-900">
            <Link 
              href="/admin/articles"
              className="px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 hover:bg-zinc-150 transition-colors cursor-pointer"
            >
              Back to Articles
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
