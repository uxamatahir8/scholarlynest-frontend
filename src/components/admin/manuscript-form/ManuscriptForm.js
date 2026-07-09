'use client';

import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import ReviewerPreferenceRepeater, { normalizeReviewerPreferences } from '../../article/ReviewerPreferenceRepeater';
import ArticleAssetBufferedDropzone from '../../article/ArticleAssetBufferedDropzone';
import ArticleAssetDropzone from '../../article/ArticleAssetDropzone';
import ArticleImagesDropzone from '../../article/ArticleImagesDropzone';
import { uploadAndAwaitClean } from '../../../lib/mediaUploads/DirectUploadClient';
import {
  appendAcademicMetadata,
  currentUserAuthor,
  emptyAcademicMetadata,
  normalizeAuthorRows,
  validateAuthors,
} from '../../article/academicArticleForm';
import { isArticleEditableStatus, normalizeStatus } from '../../../utils/status';

const RichEditor = dynamic(() => import('../../ui/RichEditor'), {
  ssr: false,
  loading: () => <LoadingState label="Loading writing editor..." className="min-h-[180px]" />,
});

const REVISION_STATUSES = new Set([
  'revision_required',
  'minor_revision_required',
  'major_revision_required',
]);

const cleanRichText = (value) => String(value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

const fieldClass = 'mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base font-semibold text-[var(--foreground)] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20';
const selectClass = 'mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base font-semibold text-[var(--foreground)] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20';
const labelClass = 'text-base font-bold text-[var(--foreground)]';
const helpClass = 'mt-1 text-sm leading-relaxed text-[var(--muted)]';

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

function Section({ id, eyebrow, title, description, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
      <div className="mb-7 border-b border-[var(--border)] pb-5">
        <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{eyebrow}</p>
        <h2 id={`${id}-heading`} className="mt-1 text-xl font-bold tracking-tight text-[var(--foreground)]">{title}</h2>
        {description && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--muted)]">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function FilePicker({ id, label, accept, fileName, existingLabel, onChange, onClear, help, error }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label htmlFor={id} className={labelClass}>{label}</label>
          {help && <p className={helpClass}>{help}</p>}
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-2 text-sm font-bold text-[var(--secondary-foreground)] transition hover:bg-[var(--surface-muted)] focus-within:ring-2 focus-within:ring-[var(--focus-ring)]">
          <Upload className="h-4 w-4" aria-hidden="true" />
          Choose File
          <input id={id} type="file" accept={accept} className="sr-only" onChange={onChange} />
        </label>
      </div>
      {(fileName || existingLabel) && (
        <div className="mt-4 flex flex-col gap-2 rounded-lg bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-base font-semibold text-[var(--foreground)]">
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
  const searchParams = useSearchParams();
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
  const [authors, setAuthors] = useState([]);
  const [suggestedReviewers, setSuggestedReviewers] = useState([]);
  const [opposedReviewers, setOpposedReviewers] = useState([]);
  const [academicMetadata, setAcademicMetadata] = useState(emptyAcademicMetadata);
  const [selectedTags, setSelectedTags] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [supplementaryFiles, setSupplementaryFiles] = useState([]);
  const [articleImages, setArticleImages] = useState([]);
  const [queuedArticleImages, setQueuedArticleImages] = useState([]);
  const [assets, setAssets] = useState([]);
  const [revisionResponse, setRevisionResponse] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [submittingIntent, setSubmittingIntent] = useState('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const status = normalizeStatus(article?.status || 'draft');
  const isRevision = REVISION_STATUSES.has(status);
  const observerReadonly = searchParams.get('observer_readonly') === '1'
    || searchParams.has('observer_user')
    || searchParams.has('observer_user_id');
  const backendAllowsEdit = article?.can_edit_article !== false;
  const canEditForm = !isEdit || (!observerReadonly && backendAllowsEdit && isArticleEditableStatus(status));

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
    if (!magazineId) missing.push({ key: 'magazineId', label: 'Choose a magazine', target: '#magazine-selection' });
    if (visibleAuthors.length === 0) missing.push({ key: 'authors', label: 'Add at least one author', target: '#authors-affiliations' });
    if (!owner) missing.push({ key: 'owner', label: 'Choose one article owner', target: '#authors-affiliations' });
    if (correspondingAuthors.length === 0) missing.push({ key: 'corresponding', label: 'Choose a corresponding author', target: '#authors-affiliations' });
    if (isRevision && !revisionResponse.trim()) missing.push({ key: 'revisionResponse', label: 'Add a response to the revision request', target: '#revision-response' });
    return missing;
  }, [abstract, correspondingAuthors.length, isRevision, magazineId, owner, revisionResponse, title, visibleAuthors.length]);
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
          requests.push(api.get(`/admin/articles/${articleId}`, {
            params: {
              view_context: 'edit',
              ...(observerReadonly ? { observer_readonly: 1 } : {}),
            },
          }));
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
          setAssets(nextArticle.assets || []);
          setArticleImages(nextArticle.article_images || (nextArticle.assets || []).filter((asset) => asset.asset_type === 'image'));
          setSuggestedReviewers(nextArticle.reviewer_preferences?.suggested || []);
          setOpposedReviewers(nextArticle.reviewer_preferences?.opposed || []);
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
        setError(safeApiMessage(err, 'The manuscript workspace could not be loaded.'));
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
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      toast('Please upload a PDF, DOC, or DOCX article file.', 'error');
      return;
    }
    setPdfFile(file);
  };

  const stepForError = (key) => {
    if (['title', 'abstract', 'magazineId'].includes(key)) return 0;
    if (['authors', 'coAuthors', 'owner', 'corresponding'].includes(key)) return 1;
    if (['suggestedReviewers', 'opposedReviewers'].includes(key)) return 2;
    if (['revisionResponse'].includes(key)) return 4;
    return 3;
  };

  const firstInvalidStep = (errors) => Math.min(...Object.keys(errors).map(stepForError));

  const validateForm = ({ scope = 'submit' } = {}) => {
    const errors = {};
    if (!magazineId) errors.magazineId = 'Please choose a magazine.';
    if (!title.trim()) errors.title = 'Please add a manuscript title.';
    if (!cleanRichText(abstract)) errors.abstract = 'Please add an abstract.';
    if (isRevision && !revisionResponse.trim()) errors.revisionResponse = 'Please add a response to the revision request.';
    if (isSuperAdmin) {
      Object.assign(errors, validateAuthors(authors, { isSuperAdmin: true, user }));
    } else if (visibleAuthors.find((author) => author.is_owner)?.email !== user?.email?.trim().toLowerCase()) {
      errors.coAuthors = 'The submitting author must remain the article owner.';
    }
    const suggested = normalizeReviewerPreferences(suggestedReviewers);
    const opposed = normalizeReviewerPreferences(opposedReviewers);
    const suggestedEmails = suggested.map((item) => item.email).filter(Boolean);
    const opposedEmails = opposed.map((item) => item.email).filter(Boolean);
    const authorEmails = visibleAuthors.map((author) => author.email).filter(Boolean);
    if (suggestedEmails.length !== new Set(suggestedEmails).size) errors.suggestedReviewers = 'Suggested reviewer emails must be unique.';
    if (opposedEmails.length !== new Set(opposedEmails).size) errors.opposedReviewers = 'Opposing reviewer emails must be unique.';
    if (suggestedEmails.some((email) => opposedEmails.includes(email))) errors.suggestedReviewers = 'A reviewer cannot be both suggested and opposed.';
    if (suggestedEmails.some((email) => authorEmails.includes(email))) errors.suggestedReviewers = 'Authors cannot be suggested as reviewers.';
    const scopedErrors = scope === 'current'
      ? Object.fromEntries(Object.entries(errors).filter(([key]) => stepForError(key) === currentStep))
      : errors;
    setValidationErrors(scopedErrors);
    if (Object.keys(errors).length > 0 && scope === 'submit') {
      setCurrentStep(firstInvalidStep(errors));
    }
    return Object.keys(scopedErrors).length === 0;
  };

  const validateCurrentStep = () => validateForm({ scope: 'current' });

  const buildFormData = (intent, uploadIds = {}) => {
    const formData = new FormData();
    const nextStatus = !isEdit
      ? (intent === 'submit' ? 'submitted' : 'draft')
      : (status === 'draft' ? (intent === 'submit' ? 'submitted' : 'draft') : status);
    formData.append('magazine_id', magazineId);
    formData.append('title', title);
    formData.append('abstract', abstract);
    formData.append('status', nextStatus);
    appendAcademicMetadata(formData, academicMetadata);
    if (uploadIds.pdf_upload_id) formData.append('pdf_upload_id', uploadIds.pdf_upload_id);
    if (revisionResponse.trim()) formData.append('revision_response', revisionResponse.trim());
    if (changeSummary.trim()) formData.append('change_summary', changeSummary.trim());
    formData.append('tags', JSON.stringify(selectedTags));
    const normalizedAuthors = normalizeAuthorRows(isSuperAdmin ? authors : visibleAuthors);
    formData.append('authors', JSON.stringify(normalizedAuthors));
    formData.append('co_authors', JSON.stringify(normalizedAuthors));
    formData.append('suggested_reviewers', JSON.stringify(normalizeReviewerPreferences(suggestedReviewers)));
    formData.append('opposed_reviewers', JSON.stringify(normalizeReviewerPreferences(opposedReviewers)));
    return formData;
  };

  const uploadSupplementaryFiles = async (nextArticleId) => {
    if (!nextArticleId || supplementaryFiles.length === 0) return true;
    let failed = 0;
    for (const file of supplementaryFiles) {
      try {
        await uploadAndAwaitClean({
          file,
          purpose: 'article_supplementary',
          attachableId: nextArticleId,
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

  const uploadArticleImages = async (nextArticleId) => {
    if (!nextArticleId || queuedArticleImages.length === 0) return true;
    let failed = 0;
    for (const file of queuedArticleImages) {
      try {
        await uploadAndAwaitClean({ file, purpose: 'article_image', attachableId: nextArticleId });
      } catch (err) {
        logError('Failed to upload article image', err);
        failed += 1;
      }
    }
    if (failed > 0) {
      toast(`Manuscript saved, but ${failed} article image upload${failed > 1 ? 's' : ''} failed.`, 'warning');
      return false;
    }
    setQueuedArticleImages([]);
    return true;
  };

  const persistManuscript = async (intent) => {
    if (!validateForm({ scope: intent === 'submit' ? 'submit' : 'current' })) {
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
      const uploadIds = {};
      if (pdfFile) {
        setSavingMessage('Uploading article file...');
        const pdfUpload = await uploadAndAwaitClean({
          file: pdfFile,
          purpose: isRevision ? 'article_revision' : 'article_manuscript',
          attachableId: isEdit ? articleId : undefined,
        });
        uploadIds.pdf_upload_id = pdfUpload.id;
      }
      setSavingMessage(intent === 'submit' ? 'Submitting manuscript...' : 'Saving draft...');
      const formData = buildFormData(intent, uploadIds);
      const response = isEdit
        ? await api.put(`/admin/articles/${articleId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        : await api.post('/articles', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const savedArticle = response.data?.article;
      await uploadSupplementaryFiles(savedArticle?.id || articleId);
      await uploadArticleImages(savedArticle?.id || articleId);
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
    const title = observerReadonly
      ? 'Observer mode is read-only'
      : isArticleEditableStatus(status)
        ? 'You do not have edit access for this manuscript'
        : 'This manuscript cannot be edited at this workflow stage';
    const description = observerReadonly
      ? 'This record was opened from a Super Admin observer queue. Workflow and manuscript editing actions are disabled in this view.'
      : isArticleEditableStatus(status)
        ? 'You can still review the manuscript workflow if you have access to the record.'
        : 'Submitted, review, production, published, rejected, withdrawn, and archived manuscripts are managed from the workflow view.';
    return (
      <div className="space-y-6">
        <Link href="/admin/articles" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to My Manuscripts
        </Link>
        <EmptyState
          icon={FileText}
          title={title}
          action={(
            <Link href={`/admin/articles/${articleId}/workflow`}>
              <Button type="button" variant="primary" icon={ChevronRight}>View Submission Status</Button>
            </Link>
          )}
        >
          {description}
        </EmptyState>
      </div>
    );
  }

  const steps = [
    'Article Basics',
    'Article Collaborators',
    'Suggested and Opposing Reviewers',
    'Keywords, Classification and Declaration',
    'Uploads',
  ];
  const goNext = () => {
    if (!validateCurrentStep()) {
      toast('Please review the highlighted fields on this step.', 'error');
      return;
    }
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };
  const goBack = () => setCurrentStep((step) => Math.max(step - 1, 0));

  return (
    <div className="w-full space-y-8 text-left">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/admin/articles" className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--foreground)]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to My Manuscripts
          </Link>
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Author Submission</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {isEdit ? 'Edit Manuscript Draft' : 'New Manuscript Submission'}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-[var(--muted)]">
            Build the manuscript record, save it as a draft, and submit it when the required scholarly details are ready.
          </p>
        </div>
        {isEdit && article?.status && <StatusBadge status={article.status} />}
      </div>

      <form className="min-w-0 space-y-8" onSubmit={(event) => event.preventDefault()}>
          <nav aria-label="Submission steps" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <ol className="grid gap-3 md:grid-cols-5">
              {steps.map((step, index) => {
                const isCurrent = index === currentStep;
                const isComplete = index < currentStep;
                return (
                  <li key={step}>
                    <button
                      type="button"
                      onClick={() => {
                        if (index <= currentStep) setCurrentStep(index);
                      }}
                      disabled={index > currentStep}
                      className={`flex min-h-16 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${isCurrent ? 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-200' : isComplete ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)]'}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-sm font-bold ring-1 ring-current/15">
                        {isComplete ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : index + 1}
                      </span>
                      <span className="text-sm font-bold leading-tight">{step}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {currentStep === 0 && (
          <Section
            id="manuscript-basics"
            eyebrow="Step 1"
            title="Article Basics"
            description="Start with the core article record. Title, magazine, and abstract are required before submission."
          >
            <div className="space-y-7">
              <div className="grid gap-5 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]">
                <div>
                  <label htmlFor="magazine-select" className={labelClass}>Magazine <span className="text-amber-700">*</span></label>
                  <select
                    id="magazine-select"
                    value={magazineId}
                    onChange={(event) => {
                      setMagazineId(event.target.value);
                      setSelectedTags([]);
                    }}
                    aria-invalid={!!validationErrors.magazineId}
                    aria-describedby={validationErrors.magazineId ? 'magazine-select-error' : undefined}
                    className={selectClass}
                  >
                    <option value="">Choose a magazine</option>
                    {magazines.map((magazine) => (
                      <option key={magazine.id} value={magazine.id}>{magazine.title}</option>
                    ))}
                  </select>
                  <FieldError id="magazine-select-error">{validationErrors.magazineId}</FieldError>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm ring-1 ring-amber-500/20 dark:bg-zinc-950 dark:text-amber-300">
                      <BookOpen className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Selected magazine</p>
                      <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">{selectedMagazine?.title || 'No magazine selected'}</h3>
                      <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[var(--muted)]">
                        {selectedMagazine?.description || 'Choose the magazine where this article should enter editorial review.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="manuscript-title" className={labelClass}>Article title <span className="text-amber-700">*</span></label>
                <p className={helpClass}>Use the final or working academic title for this manuscript.</p>
                <input
                  id="manuscript-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  aria-invalid={!!validationErrors.title}
                  aria-describedby={validationErrors.title ? 'manuscript-title-error' : undefined}
                  className={`${fieldClass} text-lg`}
                  placeholder="Enter the full manuscript title"
                />
                <FieldError id="manuscript-title-error">{validationErrors.title}</FieldError>
              </div>

              <div>
                <label className={labelClass}>Abstract <span className="text-amber-700">*</span></label>
                <p className="mb-3 mt-1 text-sm leading-relaxed text-[var(--muted)]">Summarize the research question, method, and main contribution.</p>
                <RichEditor value={abstract} onChange={setAbstract} placeholder="Write the manuscript abstract..." minHeight="220px" />
                <FieldError id="manuscript-abstract-error">{validationErrors.abstract}</FieldError>
              </div>
            </div>
          </Section>
          )}

          {currentStep === 1 && (
          <Section
            id="authors-affiliations"
            eyebrow="Step 2"
            title="Article Collaborators"
            description="List contributors, affiliations, corresponding authors, and editor access where supported."
          >
            {!isSuperAdmin && (
              <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="flex items-start gap-3">
                  <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <div>
                    <h3 className="text-base font-bold text-[var(--foreground)]">You are the submitting author and article owner</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
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
          )}

          {currentStep === 2 && (
            <div className="space-y-8">
          <Section
            id="suggested-reviewers"
            eyebrow="Step 3"
            title="Suggested Reviewers"
            description="Suggest qualified reviewers for editorial consideration. No reviewer accounts are created from this list."
          >
            <ReviewerPreferenceRepeater
              title="Suggested reviewers"
              description="Editors may invite these reviewers later, subject to conflict checks."
              rows={suggestedReviewers}
              setRows={setSuggestedReviewers}
              tone="suggested"
            />
            <FieldError id="suggested-reviewers-error">{validationErrors.suggestedReviewers}</FieldError>
          </Section>

          <Section
            id="opposing-reviewers"
            eyebrow="Step 3"
            title="Opposing Reviewers"
            description="List reviewers who should not be assigned because of conflicts or other concerns."
          >
            <ReviewerPreferenceRepeater
              title="Opposing reviewers"
              description="These reviewers are blocked from assignment by backend validation."
              rows={opposedReviewers}
              setRows={setOpposedReviewers}
              tone="opposed"
            />
            <FieldError id="opposed-reviewers-error">{validationErrors.opposedReviewers}</FieldError>
          </Section>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8">
          <Section
            id="academic-classification"
            eyebrow="Step 4"
            title="Classification and Declarations"
            description="Classify the manuscript and add optional statements when they apply to the submission."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['articleType', 'Article type', articleTypes],
                ['articleCategory', 'Category', categories],
                ['subjectArea', 'Subject area', subjectAreas],
                ['language', 'Language', languages],
              ].map(([field, label, options]) => (
                <div key={field}>
                  <label className={labelClass}>{label}</label>
                  <select
                    value={academicMetadata[field]}
                    onChange={(event) => updateAcademicMetadata(field, event.target.value)}
                    className={selectClass}
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

            <details className="mt-7 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
              <summary className="cursor-pointer text-base font-bold text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
                Optional declaration statements
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Add these statements only when they apply. The backend does not require them for draft save or submission.</p>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {[
                  ['ethicalApprovalStatement', 'Ethics statement'],
                  ['conflictOfInterestStatement', 'Conflict of interest'],
                  ['fundingStatement', 'Funding statement'],
                  ['dataAvailabilityStatement', 'Data availability'],
                  ['authorContributionStatement', 'Author contributions'],
                ].map(([field, label]) => (
                  <div key={field} className="md:last:col-span-2">
                    <label className={labelClass}>{label} <span className="font-medium text-[var(--muted)]">(optional)</span></label>
                    <textarea
                      value={academicMetadata[field]}
                      onChange={(event) => updateAcademicMetadata(field, event.target.value)}
                      rows={4}
                      className={fieldClass}
                    />
                  </div>
                ))}
              </div>
            </details>
          </Section>

          <Section
            id="keywords"
            eyebrow="Step 4"
            title="Keywords"
            description="Select magazine tags or add keywords that help editors and readers understand the manuscript topic."
          >
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                <label className={labelClass}>Keyword terms</label>
                <p className={helpClass}>Select existing magazine tags or add manuscript keywords.</p>
                {loadingTags ? (
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading keywords...
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {tags.map((tag) => {
                      const selected = selectedTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => setSelectedTags((prev) => selected ? prev.filter((item) => item !== tag.id) : [...prev, tag.id])}
                          className={`rounded-lg border px-3.5 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${selected ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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
                    className="min-h-11 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-base font-semibold text-[var(--foreground)] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <Button type="button" variant="secondary" size="lg" icon={Plus} onClick={addKeyword}>Add Keyword</Button>
                </div>
                {selectedTags.some((item) => typeof item === 'string') && (
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {selectedTags.filter((item) => typeof item === 'string').map((keyword) => (
                      <span key={keyword} className="inline-flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3.5 py-2 text-sm font-bold text-amber-700 dark:text-amber-300">
                        {keyword}
                        <button type="button" onClick={() => setSelectedTags((prev) => prev.filter((item) => item !== keyword))} aria-label={`Remove keyword ${keyword}`}>
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
          </Section>
            </div>
          )}

          {currentStep === 4 && (
          <Section
            id="manuscript-files"
            eyebrow="Step 5"
            title="Uploads"
            description="Attach the article file and supporting materials using the existing secure upload endpoints."
          >
            <div className="space-y-6">
              <div>
                <FilePicker
                  id="main-manuscript-file"
                  label="Article PDF/Word file"
                  accept="application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  fileName={pdfFile?.name || ''}
                  existingLabel={hasExistingPdf ? 'Existing article file attached' : ''}
                  onChange={handlePdfChange}
                  onClear={() => setPdfFile(null)}
                  help="Only one PDF, DOC, or DOCX file is allowed."
                />
              </div>

              {isEdit ? (
                <ArticleAssetDropzone articleId={articleId} assets={assets} onAssetsChanged={setAssets} />
              ) : (
                <ArticleAssetBufferedDropzone files={supplementaryFiles} onFilesChanged={setSupplementaryFiles} />
              )}

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">Article Images</h3>
                <ArticleImagesDropzone
                  articleId={isEdit ? articleId : null}
                  images={articleImages}
                  queuedImages={queuedArticleImages}
                  onQueuedImagesChanged={setQueuedArticleImages}
                  onImagesChanged={setArticleImages}
                />
              </div>
            </div>
          </Section>
          )}

          {currentStep === 4 && isRevision && (
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

          <div className="flex flex-col-reverse gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {currentStep > 0 && (
                <Button type="button" variant="secondary" size="lg" icon={ArrowLeft} onClick={goBack} disabled={saving}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                icon={Save}
                onClick={() => persistManuscript('draft')}
                disabled={saving || isRevision}
                isLoading={saving && submittingIntent === 'draft'}
              >
                Save as Draft
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button type="button" variant="primary" size="lg" icon={ChevronRight} onClick={goNext} disabled={saving}>
                  {currentStep === 1 && !isSuperAdmin ? 'Skip / Next' : 'Next'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  icon={Send}
                  onClick={() => {
                    if (!validateForm({ scope: 'submit' }) || readiness.length > 0) {
                      toast('Complete the readiness items before final submission.', 'error');
                      return;
                    }
                    setShowSubmitConfirm(true);
                  }}
                  disabled={saving}
                  isLoading={saving && submittingIntent === 'submit'}
                >
                  {isRevision ? 'Submit Revision' : 'Submit Article'}
                </Button>
              )}
            </div>
          </div>
        {savingMessage && <p className="text-center text-xs font-semibold text-[var(--muted)]">{savingMessage}</p>}
      </form>

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
