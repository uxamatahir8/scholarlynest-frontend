'use client';

import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  MailCheck,
  Plus,
  Save,
  Send,
  Upload,
  X,
} from 'lucide-react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../ui/Button';
import EmptyState from '../../ui/EmptyState';
import ErrorState from '../../ui/ErrorState';
import LoadingState from '../../ui/LoadingState';
import StatusBadge from '../../ui/StatusBadge';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import CoAuthorRepeater from '../../article/CoAuthorRepeater';
import ArticleAssetBufferedDropzone from '../../article/ArticleAssetBufferedDropzone';
import ArticleAssetDropzone from '../../article/ArticleAssetDropzone';
import {
  appendAcademicMetadata,
  currentUserAuthor,
  emptyAcademicMetadata,
  normalizeAuthorRows,
  validateAuthors,
} from '../../article/academicArticleForm';

const RichEditor = dynamic(() => import('../../ui/RichEditor'), {
  ssr: false,
  loading: () => <LoadingState label="Loading writing editor..." className="min-h-[180px]" />,
});

const AUTHOR_EDITABLE_STATUSES = new Set([
  'draft',
  'revision_required',
  'minor_revision_required',
  'major_revision_required',
]);

const REVISION_STATUSES = new Set([
  'revision_required',
  'minor_revision_required',
  'major_revision_required',
]);

const cleanRichText = (value) => String(value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

const normalizeListResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeArticleAuthor = (author) => ({
  name: author.co_author_name || author.name || '',
  email: author.co_author_email || author.email || '',
  affiliation: author.affiliation || author.university_name || '',
  university_name: author.university_name || author.affiliation || '',
  department: author.department || '',
  country: author.country || '',
  orcid: author.orcid || '',
  author_order: author.author_order || 1,
  is_owner: !!author.is_owner,
  is_corresponding: !!author.is_corresponding,
  can_edit: !!author.can_edit,
  create_account: !!author.account_provisioned || !!author.user_id,
  contribution_statement: author.contribution_statement || '',
  user_id: author.user_id || null,
});

function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600">
      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </p>
  );
}

function Section({ id, eyebrow, title, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24 border-t border-[var(--border)] pt-8">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">{eyebrow}</p>
        <h2 id={`${id}-heading`} className="mt-1 text-lg font-bold text-[var(--foreground)]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function FilePicker({ id, label, accept, fileName, existingLabel, onChange, onClear, help, error }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label htmlFor={id} className="text-sm font-bold text-[var(--foreground)]">{label}</label>
          {help && <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{help}</p>}
        </div>
        <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-2 text-xs font-bold text-[var(--secondary-foreground)] transition hover:bg-[var(--surface-muted)] focus-within:ring-2 focus-within:ring-[var(--focus-ring)]">
          <Upload className="h-4 w-4" aria-hidden="true" />
          Choose File
          <input id={id} type="file" accept={accept} className="sr-only" onChange={onChange} />
        </label>
      </div>
      {(fileName || existingLabel) && (
        <div className="mt-4 flex flex-col gap-2 rounded-lg bg-[var(--surface-muted)] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            <FileText className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <span className="truncate">{fileName || existingLabel}</span>
          </div>
          {fileName && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Remove
            </button>
          )}
        </div>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

export default function ManuscriptForm({ mode = 'create', articleId = null }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, hasRole, hasPermission, loading: authLoading } = useAuth();
  const isEdit = mode === 'edit';
  const isSuperAdmin = hasRole('super_admin');
  const canCreate = hasPermission('articles.create');
  const canEditOwn = hasPermission('articles.edit-own');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [article, setArticle] = useState(null);
  const [magazines, setMagazines] = useState([]);
  const [articleTypes, setArticleTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subjectAreas, setSubjectAreas] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);

  const [magazineId, setMagazineId] = useState('');
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [fullText, setFullText] = useState('');
  const [authors, setAuthors] = useState([]);
  const [academicMetadata, setAcademicMetadata] = useState(emptyAcademicMetadata);
  const [selectedTags, setSelectedTags] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [featuredImage, setFeaturedImage] = useState(null);
  const [deleteFeaturedImage, setDeleteFeaturedImage] = useState(false);
  const [supplementaryFiles, setSupplementaryFiles] = useState([]);
  const [assets, setAssets] = useState([]);
  const [revisionResponse, setRevisionResponse] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [submittingIntent, setSubmittingIntent] = useState('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState('');

  const status = article?.status || 'draft';
  const isRevision = REVISION_STATUSES.has(status);
  const canEditForm = !isEdit || isSuperAdmin || AUTHOR_EDITABLE_STATUSES.has(status);

  const visibleAuthors = useMemo(() => {
    if (isSuperAdmin) return normalizeAuthorRows(authors);
    return normalizeAuthorRows([currentUserAuthor(user), ...authors]);
  }, [authors, isSuperAdmin, user]);

  const selectedMagazine = magazines.find((magazine) => String(magazine.id) === String(magazineId));
  const owner = visibleAuthors.find((author) => author.is_owner);
  const correspondingAuthors = visibleAuthors.filter((author) => author.is_corresponding);
  const hasExistingPdf = Boolean(article?.has_pdf);

  const readiness = useMemo(() => {
    const missing = [];
    if (!title.trim()) missing.push({ key: 'title', label: 'Add a manuscript title', target: '#manuscript-basics' });
    if (!cleanRichText(abstract)) missing.push({ key: 'abstract', label: 'Add an abstract', target: '#manuscript-basics' });
    if (!cleanRichText(fullText)) missing.push({ key: 'fullText', label: 'Add the manuscript text', target: '#manuscript-basics' });
    if (!magazineId) missing.push({ key: 'magazineId', label: 'Choose a journal', target: '#journal-selection' });
    if (visibleAuthors.length === 0) missing.push({ key: 'authors', label: 'Add at least one author', target: '#authors-affiliations' });
    if (!owner) missing.push({ key: 'owner', label: 'Choose one article owner', target: '#authors-affiliations' });
    if (correspondingAuthors.length === 0) missing.push({ key: 'corresponding', label: 'Choose a corresponding author', target: '#authors-affiliations' });
    if (isRevision && !revisionResponse.trim()) missing.push({ key: 'revisionResponse', label: 'Add a response to the revision request', target: '#revision-response' });
    return missing;
  }, [abstract, correspondingAuthors.length, fullText, isRevision, magazineId, owner, revisionResponse, title, visibleAuthors.length]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const loadForm = async () => {
      try {
        setLoading(true);
        setError('');
        const requests = [
          api.get('/magazines', { params: { all: true } }),
          api.get('/article-types', { params: { active_only: 1 } }),
          api.get('/article-categories', { params: { active_only: 1 } }),
          api.get('/subject-areas', { params: { active_only: 1 } }),
          api.get('/languages', { params: { active_only: 1 } }),
        ];
        if (isEdit && articleId) {
          requests.push(api.get(`/admin/articles/${articleId}`));
        }

        const [magazinesRes, typesRes, categoriesRes, areasRes, languagesRes, articleRes] = await Promise.all(requests);
        const nextMagazines = normalizeListResponse(magazinesRes.data);
        const nextTypes = normalizeListResponse(typesRes.data);
        const nextCategories = normalizeListResponse(categoriesRes.data);
        const nextAreas = normalizeListResponse(areasRes.data);
        const nextLanguages = normalizeListResponse(languagesRes.data);

        setMagazines(nextMagazines);
        setArticleTypes(nextTypes);
        setCategories(nextCategories);
        setSubjectAreas(nextAreas);
        setLanguages(nextLanguages);

        if (articleRes?.data) {
          const nextArticle = articleRes.data;
          setArticle(nextArticle);
          setMagazineId(String(nextArticle.magazine_id || ''));
          setTitle(nextArticle.title || '');
          setAbstract(nextArticle.abstract || '');
          setFullText(nextArticle.full_text || '');
          setAssets(nextArticle.assets || []);
          setSelectedTags(Array.isArray(nextArticle.tags) ? nextArticle.tags.map((tag) => tag.id) : []);
          setAcademicMetadata({
            articleCategory: nextArticle.article_category || '',
            articleType: nextArticle.article_type || '',
            subjectArea: nextArticle.subject_area || '',
            language: nextArticle.language || 'English',
            ethicalApprovalStatement: nextArticle.ethical_approval_statement || '',
            conflictOfInterestStatement: nextArticle.conflict_of_interest_statement || '',
            fundingStatement: nextArticle.funding_statement || '',
            dataAvailabilityStatement: nextArticle.data_availability_statement || '',
            authorContributionStatement: nextArticle.author_contribution_statement || '',
          });
          const articleAuthors = Array.isArray(nextArticle.article_authors)
            ? nextArticle.article_authors.map(normalizeArticleAuthor)
            : [];
          if (isSuperAdmin) {
            setAuthors(normalizeAuthorRows(articleAuthors));
          } else {
            const currentEmail = user?.email?.trim().toLowerCase();
            setAuthors(normalizeAuthorRows(articleAuthors.filter((author) => author.email.trim().toLowerCase() !== currentEmail)));
          }
        } else {
          const defaultMagazine = nextMagazines[0]?.id ? String(nextMagazines[0].id) : '';
          setMagazineId(defaultMagazine);
          setAcademicMetadata((prev) => ({
            ...prev,
            articleType: nextTypes[0]?.name || prev.articleType,
            articleCategory: nextCategories[0]?.name || prev.articleCategory,
            subjectArea: nextAreas[0]?.name || prev.subjectArea,
            language: nextLanguages.find((language) => language.name?.toLowerCase() === 'english')?.name || nextLanguages[0]?.name || prev.language,
          }));
        }
      } catch (err) {
        logError(err);
        setError('The manuscript workspace could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [articleId, authLoading, isEdit, isSuperAdmin, user]);

  useEffect(() => {
    if (!magazineId) return;
    const loadTags = async () => {
      try {
        setLoadingTags(true);
        const response = await api.get('/tags', { params: { magazine_id: magazineId } });
        setTags(normalizeListResponse(response.data));
      } catch (err) {
        logError('Failed to load manuscript tags', err);
      } finally {
        setLoadingTags(false);
      }
    };
    loadTags();
  }, [magazineId]);

  const updateAcademicMetadata = (field, value) => {
    setAcademicMetadata((prev) => ({ ...prev, [field]: value }));
  };

  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (!keyword) return;
    const existing = selectedTags.some((item) => {
      if (typeof item === 'string') return item.toLowerCase() === keyword.toLowerCase();
      const tag = tags.find((candidate) => candidate.id === item);
      return tag?.name?.toLowerCase() === keyword.toLowerCase();
    });
    if (existing) {
      toast('Keyword is already selected.', 'error');
      return;
    }
    const existingTag = tags.find((tag) => tag.name?.toLowerCase() === keyword.toLowerCase());
    setSelectedTags((prev) => [...prev, existingTag?.id || keyword]);
    setKeywordInput('');
  };

  const handlePdfChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast('Please upload a PDF manuscript file.', 'error');
      return;
    }
    setPdfFile(file);
  };

  const handleFeaturedImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please upload a valid image file.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Image file size must be less than 5MB.', 'error');
      return;
    }
    setFeaturedImage(file);
    setDeleteFeaturedImage(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!magazineId) errors.magazineId = 'Please choose a journal.';
    if (!title.trim()) errors.title = 'Please add a manuscript title.';
    if (!cleanRichText(abstract)) errors.abstract = 'Please add an abstract.';
    if (!cleanRichText(fullText)) errors.fullText = 'Please add the manuscript text.';
    if (isRevision && !revisionResponse.trim()) errors.revisionResponse = 'Please add a response to the revision request.';
    Object.assign(errors, validateAuthors(isSuperAdmin ? authors : visibleAuthors, { isSuperAdmin: true, user }));
    if (!isSuperAdmin && visibleAuthors.find((author) => author.is_owner)?.email !== user?.email?.trim().toLowerCase()) {
      errors.coAuthors = 'The submitting author must remain the article owner.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildFormData = (intent) => {
    const formData = new FormData();
    formData.append('magazine_id', magazineId);
    formData.append('title', title);
    formData.append('abstract', abstract);
    formData.append('full_text', fullText);
    formData.append('status', intent === 'submit' ? 'submitted' : 'draft');
    appendAcademicMetadata(formData, academicMetadata);
    if (pdfFile) formData.append('pdf_file', pdfFile);
    if (featuredImage) formData.append('featured_image', featuredImage);
    if (deleteFeaturedImage) formData.append('delete_featured_image', 'true');
    if (revisionResponse.trim()) formData.append('revision_response', revisionResponse.trim());
    if (changeSummary.trim()) formData.append('change_summary', changeSummary.trim());
    formData.append('tags', JSON.stringify(selectedTags));
    const normalizedAuthors = normalizeAuthorRows(isSuperAdmin ? authors : visibleAuthors);
    formData.append('authors', JSON.stringify(normalizedAuthors));
    formData.append('co_authors', JSON.stringify(normalizedAuthors));
    return formData;
  };

  const uploadSupplementaryFiles = async (nextArticleId) => {
    if (!nextArticleId || supplementaryFiles.length === 0) return true;
    let failed = 0;
    for (const file of supplementaryFiles) {
      try {
        const assetForm = new FormData();
        assetForm.append('file', file);
        await api.post(`/articles/${nextArticleId}/assets`, assetForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch (err) {
        logError('Failed to upload supplementary manuscript asset', err);
        failed += 1;
      }
    }
    if (failed > 0) {
      toast(`Manuscript saved, but ${failed} supplementary file upload${failed > 1 ? 's' : ''} failed.`, 'warning');
      return false;
    }
    return true;
  };

  const persistManuscript = async (intent) => {
    if (!validateForm()) {
      toast('Please review the highlighted manuscript requirements.', 'error');
      return;
    }
    if (intent === 'submit' && readiness.length > 0) {
      toast('Complete the submission readiness items before final submission.', 'error');
      return;
    }

    try {
      setSaving(true);
      setSubmittingIntent(intent);
      setSavingMessage(intent === 'submit' ? 'Submitting manuscript...' : 'Saving draft...');
      const formData = buildFormData(intent);
      const response = isEdit
        ? await api.put(`/admin/articles/${articleId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        : await api.post('/articles', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const savedArticle = response.data?.article;
      await uploadSupplementaryFiles(savedArticle?.id || articleId);
      toast(intent === 'submit' ? 'Manuscript submitted for editorial review.' : 'Draft manuscript saved.', 'success');
      if (intent === 'submit') {
        router.push(savedArticle?.id ? `/admin/articles/${savedArticle.id}/workflow` : '/admin/articles');
      } else if (!isEdit && savedArticle?.id) {
        router.push(`/admin/articles/${savedArticle.id}/edit`);
      } else {
        router.refresh();
      }
    } catch (err) {
      logError(err);
      toast(safeApiMessage(err, intent === 'submit' ? 'Unable to submit manuscript.' : 'Unable to save draft.'), 'error');
    } finally {
      setSaving(false);
      setSubmittingIntent('');
      setSavingMessage('');
      setShowSubmitConfirm(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingState label="Loading manuscript workspace..." className="min-h-[420px]" />;
  }

  if (!user || (!canCreate && !isEdit) || (isEdit && !canEditOwn)) {
    return <ErrorState title="Access restricted">You do not have manuscript submission access.</ErrorState>;
  }

  if (error) {
    return <ErrorState title="Manuscript unavailable">{error}</ErrorState>;
  }

  if (isEdit && !canEditForm) {
    return (
      <div className="space-y-6">
        <Link href="/admin/articles" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to My Manuscripts
        </Link>
        <EmptyState
          icon={FileText}
          title="This manuscript is no longer editable as a draft"
          action={(
            <Link href={`/admin/articles/${articleId}/workflow`}>
              <Button type="button" variant="primary" icon={ChevronRight}>View Submission Status</Button>
            </Link>
          )}
        >
          Submitted, review, production, and published manuscripts are managed through the workflow status view.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 text-left">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/admin/articles" className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--foreground)]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to My Manuscripts
          </Link>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Author Submission</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {isEdit ? 'Edit Manuscript Draft' : 'New Manuscript Submission'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            Build the manuscript record, save it as a draft, and submit it when the required scholarly details are ready.
          </p>
        </div>
        {isEdit && article?.status && <StatusBadge status={article.status} />}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form className="min-w-0 space-y-10" onSubmit={(event) => event.preventDefault()}>
          <Section id="manuscript-basics" eyebrow="Step 1" title="Manuscript Basics">
            <div className="space-y-5">
              <div>
                <label htmlFor="manuscript-title" className="text-sm font-bold text-[var(--foreground)]">Article title</label>
                <input
                  id="manuscript-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  aria-invalid={!!validationErrors.title}
                  aria-describedby={validationErrors.title ? 'manuscript-title-error' : undefined}
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  placeholder="Enter the full manuscript title"
                />
                <FieldError id="manuscript-title-error">{validationErrors.title}</FieldError>
              </div>

              <div>
                <label className="text-sm font-bold text-[var(--foreground)]">Abstract</label>
                <p className="mb-2 mt-1 text-xs text-[var(--muted)]">Summarize the research question, method, and main contribution.</p>
                <RichEditor value={abstract} onChange={setAbstract} placeholder="Write the manuscript abstract..." />
                <FieldError id="manuscript-abstract-error">{validationErrors.abstract}</FieldError>
              </div>

              <div>
                <label className="text-sm font-bold text-[var(--foreground)]">Manuscript text</label>
                <p className="mb-2 mt-1 text-xs text-[var(--muted)]">Use the structured editor for the submission text. A PDF may also be attached below.</p>
                <RichEditor value={fullText} onChange={setFullText} placeholder="Write or paste the manuscript text..." />
                <FieldError id="manuscript-text-error">{validationErrors.fullText}</FieldError>
              </div>
            </div>
          </Section>

          <Section id="journal-selection" eyebrow="Step 2" title="Journal Selection">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <label htmlFor="journal-select" className="text-sm font-bold text-[var(--foreground)]">Journal</label>
                <select
                  id="journal-select"
                  value={magazineId}
                  onChange={(event) => {
                    setMagazineId(event.target.value);
                    setSelectedTags([]);
                  }}
                  aria-invalid={!!validationErrors.magazineId}
                  aria-describedby={validationErrors.magazineId ? 'journal-select-error' : undefined}
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">Choose a journal</option>
                  {magazines.map((magazine) => (
                    <option key={magazine.id} value={magazine.id}>{magazine.title}</option>
                  ))}
                </select>
                <FieldError id="journal-select-error">{validationErrors.magazineId}</FieldError>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">{selectedMagazine?.title || 'No journal selected'}</h3>
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--muted)]">
                      {selectedMagazine?.description || 'Choose the journal where this manuscript should enter editorial review.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section id="authors-affiliations" eyebrow="Step 3" title="Authors and Affiliations">
            {!isSuperAdmin && (
              <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-start gap-3">
                  <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">You are the submitting author and article owner</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                      Add collaborators below. You may mark additional corresponding authors, but manuscript ownership remains with your account.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <CoAuthorRepeater
              coAuthors={authors}
              setCoAuthors={setAuthors}
              currentUserEmail={user?.email}
              required={isSuperAdmin}
              allowOwnerControl={isSuperAdmin}
            />
            <FieldError id="authors-error">{validationErrors.coAuthors}</FieldError>
          </Section>

          <Section id="academic-classification" eyebrow="Step 4" title="Classification and Declarations">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['articleType', 'Article type', articleTypes],
                ['articleCategory', 'Category', categories],
                ['subjectArea', 'Subject area', subjectAreas],
                ['language', 'Language', languages],
              ].map(([field, label, options]) => (
                <div key={field}>
                  <label className="text-sm font-bold text-[var(--foreground)]">{label}</label>
                  <select
                    value={academicMetadata[field]}
                    onChange={(event) => updateAcademicMetadata(field, event.target.value)}
                    className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="">Select</option>
                    {options.map((option) => <option key={option.id || option.name} value={option.name}>{option.name}</option>)}
                    {academicMetadata[field] && !options.some((option) => option.name === academicMetadata[field]) && (
                      <option value={academicMetadata[field]}>{academicMetadata[field]}</option>
                    )}
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ['ethicalApprovalStatement', 'Ethical approval statement'],
                ['conflictOfInterestStatement', 'Conflict of interest statement'],
                ['fundingStatement', 'Funding statement'],
                ['dataAvailabilityStatement', 'Data availability statement'],
                ['authorContributionStatement', 'Author contribution statement'],
              ].map(([field, label]) => (
                <div key={field} className="sm:last:col-span-2">
                  <label className="text-sm font-bold text-[var(--foreground)]">{label}</label>
                  <textarea
                    value={academicMetadata[field]}
                    onChange={(event) => updateAcademicMetadata(field, event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              ))}
            </div>
          </Section>

          <Section id="keywords-files" eyebrow="Step 5" title="Keywords and Files">
            <div className="space-y-6">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <label className="text-sm font-bold text-[var(--foreground)]">Keywords</label>
                <p className="mt-1 text-xs text-[var(--muted)]">Select existing journal tags or add manuscript keywords.</p>
                {loadingTags ? (
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading keywords...
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const selected = selectedTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => setSelectedTags((prev) => selected ? prev.filter((item) => item !== tag.id) : [...prev, tag.id])}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${selected ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={keywordInput}
                    onChange={(event) => setKeywordInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addKeyword();
                      }
                    }}
                    placeholder="Add a keyword"
                    className="min-h-10 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <Button type="button" variant="secondary" icon={Plus} onClick={addKeyword}>Add Keyword</Button>
                </div>
                {selectedTags.some((item) => typeof item === 'string') && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedTags.filter((item) => typeof item === 'string').map((keyword) => (
                      <span key={keyword} className="inline-flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                        {keyword}
                        <button type="button" onClick={() => setSelectedTags((prev) => prev.filter((item) => item !== keyword))} aria-label={`Remove keyword ${keyword}`}>
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FilePicker
                  id="main-manuscript-file"
                  label="Main manuscript PDF"
                  accept="application/pdf"
                  fileName={pdfFile?.name || ''}
                  existingLabel={hasExistingPdf ? 'Existing manuscript PDF attached' : ''}
                  onChange={handlePdfChange}
                  onClear={() => setPdfFile(null)}
                  help="Optional PDF manuscript. The text editor content remains required."
                />
                <FilePicker
                  id="featured-image-file"
                  label="Featured image"
                  accept="image/*"
                  fileName={featuredImage?.name || ''}
                  existingLabel={article?.featured_image && !deleteFeaturedImage ? 'Existing image attached' : ''}
                  onChange={handleFeaturedImageChange}
                  onClear={() => {
                    setFeaturedImage(null);
                    setDeleteFeaturedImage(true);
                  }}
                  help="Optional image used where the manuscript is displayed."
                />
              </div>

              {isEdit ? (
                <ArticleAssetDropzone articleId={articleId} assets={assets} onAssetsChanged={setAssets} />
              ) : (
                <ArticleAssetBufferedDropzone files={supplementaryFiles} onFilesChanged={setSupplementaryFiles} />
              )}
            </div>
          </Section>

          {isRevision && (
            <Section id="revision-response" eyebrow="Revision" title="Revision Response">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-[var(--foreground)]">Response to revision request</label>
                  <textarea
                    value={revisionResponse}
                    onChange={(event) => setRevisionResponse(event.target.value)}
                    rows={6}
                    aria-invalid={!!validationErrors.revisionResponse}
                    className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    placeholder="Explain how the revised manuscript addresses the request."
                  />
                  <FieldError id="revision-response-error">{validationErrors.revisionResponse}</FieldError>
                </div>
                <div>
                  <label className="text-sm font-bold text-[var(--foreground)]">Change summary</label>
                  <textarea
                    value={changeSummary}
                    onChange={(event) => setChangeSummary(event.target.value)}
                    rows={6}
                    className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    placeholder="Summarize key manuscript changes."
                  />
                </div>
              </div>
            </Section>
          )}
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Review</p>
              <h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">Submission Readiness</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Title</span>
                <p className="mt-1 line-clamp-2 font-semibold text-[var(--foreground)]">{title || 'Not added yet'}</p>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Journal</span>
                <p className="mt-1 font-semibold text-[var(--foreground)]">{selectedMagazine?.title || 'Not selected'}</p>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Authors</span>
                <p className="mt-1 font-semibold text-[var(--foreground)]">{visibleAuthors.length || 0} listed</p>
                {owner && <p className="mt-1 text-xs text-[var(--muted)]">Owner: {owner.name || owner.email}</p>}
                {correspondingAuthors.length > 0 && (
                  <p className="mt-1 text-xs text-[var(--muted)]">Corresponding: {correspondingAuthors.map((author) => author.name || author.email).join(', ')}</p>
                )}
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Files</span>
                <p className="mt-1 font-semibold text-[var(--foreground)]">{pdfFile || hasExistingPdf ? 'Main PDF attached' : 'Text manuscript only'}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{isEdit ? `${assets.length} supplementary file${assets.length === 1 ? '' : 's'}` : `${supplementaryFiles.length} supplementary file${supplementaryFiles.length === 1 ? '' : 's'} queued`}</p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              {readiness.length === 0 ? (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">Ready to submit</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">Server validation will make the final decision when you submit.</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Missing information</h3>
                  <ul className="mt-3 space-y-2">
                    {readiness.map((item) => (
                      <li key={item.key}>
                        <a href={item.target} className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 hover:underline dark:text-amber-400">
                          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="secondary"
                icon={Save}
                onClick={() => persistManuscript('draft')}
                disabled={saving || isRevision}
                isLoading={saving && submittingIntent === 'draft'}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                variant="primary"
                icon={Send}
                onClick={() => {
                  if (!validateForm() || readiness.length > 0) {
                    toast('Complete the readiness items before final submission.', 'error');
                    return;
                  }
                  setShowSubmitConfirm(true);
                }}
                disabled={saving}
                isLoading={saving && submittingIntent === 'submit'}
              >
                {isRevision ? 'Submit Revision' : 'Submit Manuscript'}
              </Button>
              {savingMessage && <p className="text-center text-xs font-semibold text-[var(--muted)]">{savingMessage}</p>}
            </div>
          </div>
        </aside>
      </div>

      <ConfirmationModal
        isOpen={showSubmitConfirm}
        title={isRevision ? 'Submit revised manuscript?' : 'Submit manuscript?'}
        message={isRevision
          ? 'Submitting this revision will send the updated manuscript back for editorial review.'
          : 'Submitting this manuscript will send it for editorial review. You will no longer be able to edit it as a draft.'}
        confirmText={isRevision ? 'Submit Revision' : 'Submit Manuscript'}
        cancelText="Keep Editing"
        variant="gold"
        isLoading={saving}
        onCancel={() => setShowSubmitConfirm(false)}
        onConfirm={() => persistManuscript('submit')}
      />
    </div>
  );
}
