'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Bell, Check, CheckCircle2, ClipboardCheck, FileCheck2, Loader2, Send, Upload, UserPlus, XCircle } from 'lucide-react';
import api from '../../utils/api';
import { safeApiMessage } from '../../utils/safeErrors';
import { logError } from '../../utils/safeLogger';
import Alert from '../ui/Alert';
import { Button } from '../ui/Button';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import Field from '../ui/Field';
import { Input, Select } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import EmptyState from '../ui/EmptyState';
import FlatpickrInput from '../ui/FlatpickrInput';
import WorkflowSection from './workflow/WorkflowSection';
import { labelize } from './workflow/workflowDisplay';
import {
  PUBLISHABLE_STATUSES,
  REVIEWABLE_STATUSES,
} from './articleWorkflow';
import { uploadAndAwaitClean } from '../../lib/mediaUploads/DirectUploadClient';
import {
	  finalEditorialDecisionSchema,
	  articleTransferRejectSchema,
	  articleTransferRequestSchema,
	  postPublicationWorkflowSchema,
  productionAssignmentSchema,
  productionCompletionSchema,
  reviewerWorkflowSubmitSchemaFor,
  subEditorRecommendationSchema,
  validateWithZod,
  workflowAssigneeSchema,
  workflowManualReviewerSchema,
  workflowScreeningSchema,
  workflowSuggestedReviewerSchema,
} from '../../lib/validation';
import { REVIEWER_WORKSPACE_SECTIONS } from './workflow/workspaceManifest.mjs';

const recommendationOptions = [
  { value: 'accept', label: 'Accept' },
  { value: 'minor_revision', label: 'Minor Revision' },
  { value: 'major_revision', label: 'Major Revision' },
  { value: 'reject', label: 'Reject' },
];

const decisionOptions = [
  { value: 'accepted', label: 'Accept Article' },
  { value: 'minor_revision', label: 'Request Minor Revision' },
  { value: 'major_revision', label: 'Request Major Revision' },
  { value: 'rejected', label: 'Reject Article' },
];

const decisionSourceOptions = [
  { value: 'editor_personal_review', label: 'Editor Personal Review' },
  { value: 'sub_editor_recommendation', label: 'Sub Editor Recommendation' },
  { value: 'reviewer_recommendation', label: 'Reviewer Recommendation' },
  { value: 'mixed_editorial_decision', label: 'Mixed Editorial Decision' },
];

const postPublicationActions = [
  { value: 'correction', label: 'Correction' },
  { value: 'retraction', label: 'Retraction' },
  { value: 'update', label: 'Update' },
  { value: 'archive', label: 'Archive' },
  { value: 'unpublish', label: 'Unpublish' },
];

const productionStatuses = new Set(['accepted', 'copy_editing', 'ready_for_publication']);
const activeProductionAssignmentStatuses = new Set(['active', 'pending', 'in_progress', 'assigned']);

function ActionBlock({ title, description, children }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
      {(title || description) && <div className="mb-4">
        {title && <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>}
        {description && <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{description}</p>}
      </div>}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function WorkflowActionPanel({
  article,
  workflowContext,
  user,
  hasRole,
  onWorkflowChanged,
  onOpenPublish,
  toast,
  hideIfNoAction = false,
  actionScope = null,
  reviewerCanManage = null,
}) {
  const [busyAction, setBusyAction] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [assignees, setAssignees] = useState({});
  const [screenForm, setScreenForm] = useState({ decision: 'send_to_review', plagiarism_status: '', plagiarism_score: '', comments: '' });
  const [transferTargets, setTransferTargets] = useState([]);
  const [transferForm, setTransferForm] = useState({ to_magazine_id: '', editor_comments: '' });
  const [transferRejectForm, setTransferRejectForm] = useState({ author_rejection_reason: '' });
  const [subEditorId, setSubEditorId] = useState('');
  const [manualReviewer, setManualReviewer] = useState({ name: '', email: '', affiliation: '' });
  const [productionForm, setProductionForm] = useState({ user_id: '', role: 'copy_editor', due_date: '' });
  const [authorFinalReason, setAuthorFinalReason] = useState('');
  const [subEditorForm, setSubEditorForm] = useState({ recommendation: 'minor_revision', comments: '', internal_notes: '' });
  const [reviewForm, setReviewForm] = useState({ recommendation: 'minor_revision', comments_for_author: '', confidential_comments: '' });
  const [questionnaireResponses, setQuestionnaireResponses] = useState({});
  const [questionnaireComments, setQuestionnaireComments] = useState({});
  const [decisionForm, setDecisionForm] = useState({ decision: 'accepted', decision_source: 'mixed_editorial_decision', comments_for_author: '', internal_notes: '' });
  const [postForm, setPostForm] = useState({ action_type: 'correction', reason: '', notice_text: '' });
  const [files, setFiles] = useState({
    plagiarism_report: null,
    annotated_manuscript: null,
    reviewed_manuscript: null,
    production_file: null,
  });

  const isAdmin = hasRole('super_admin') || hasRole('admin');
  const isEditor = hasRole('editor');
  const isSubEditor = hasRole('sub_editor');
  const isReviewer = hasRole('reviewer');
  const isPublisher = hasRole('publisher');
  const isCopyEditor = hasRole('copy_editor');
  const canEditorial = isAdmin || isEditor;
  const canAssignReviewer = isAdmin || isEditor || isSubEditor;
  const canPublish = isAdmin || isPublisher;
  const canAssignProduction = isAdmin || isPublisher;

  const mySubEditorAssignment = useMemo(() => (
    (workflowContext?.sub_editor_assignments || []).find((item) => Number(item.sub_editor_id) === Number(user?.id))
  ), [workflowContext, user]);

  const myReviewerAssignment = useMemo(() => (
    (workflowContext?.reviewer_assignments || []).find((item) => Number(item.reviewer_id) === Number(user?.id))
  ), [workflowContext, user]);
  const reviewerQuestions = myReviewerAssignment?.questionnaire_instance?.questions || [];
  const hasQuestionnaireFinalDecision = reviewerQuestions.some((question) => question.prompt?.toLowerCase() === 'final decision');

  const myProductionAssignment = useMemo(() => (
    (workflowContext?.production_assignments || []).find((item) => {
      const roleMatches = isCopyEditor ? item.role === 'copy_editor' : true;
      const userMatches = isAdmin || Number(item.user_id) === Number(user?.id);
      return userMatches && roleMatches && activeProductionAssignmentStatuses.has(item.status);
    })
  ), [workflowContext, user, isAdmin, isCopyEditor]);

  const completedProductionAssignment = useMemo(() => (
    (workflowContext?.production_assignments || []).find((item) => {
      const roleMatches = isCopyEditor ? item.role === 'copy_editor' : true;
      const userMatches = isAdmin || Number(item.user_id) === Number(user?.id);
      return userMatches && roleMatches && item.status === 'completed';
    })
  ), [workflowContext, user, isAdmin, isCopyEditor]);

  const hasCopyEditorAssignment = useMemo(() => (
    (workflowContext?.production_assignments || []).some((item) => item.role === 'copy_editor')
  ), [workflowContext]);

  const reviewerAssignmentsByEmail = useMemo(() => {
    const assignmentsByEmail = new Map();
    [...(article?.reviewer_assignments || [])]
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
      .forEach((assignment) => {
        const email = String(assignment.invitee_email || assignment.reviewer?.email || '').trim().toLowerCase();
        if (email) assignmentsByEmail.set(email, assignment);
      });
    return assignmentsByEmail;
  }, [article?.reviewer_assignments]);

  const allReviewersToShow = useMemo(() => {
    const suggestedList = article?.reviewer_preferences?.suggested || [];
    const suggestedEmails = new Set(suggestedList.map((reviewer) => String(reviewer.email || '').trim().toLowerCase()));

    const getAssignmentForEmail = (email) => {
      const normalized = String(email || '').trim().toLowerCase();
      return normalized ? reviewerAssignmentsByEmail.get(normalized) || null : null;
    };

    const manualInvitations = [...reviewerAssignmentsByEmail.values()].filter(
      (assignment) => !suggestedEmails.has(String(assignment.invitee_email || '').trim().toLowerCase())
    ).map((assignment) => ({
      id: assignment.id,
      name: assignment.invitee_name || assignment.reviewer?.name,
      email: assignment.invitee_email || assignment.reviewer?.email,
      affiliation: assignment.reviewer?.affiliation || '',
      isManual: true,
      status: assignment.invitation_state || assignment.status,
    }));

    return [
      ...suggestedList.map((reviewer) => {
        const existingAssignment = getAssignmentForEmail(reviewer.email);
        const state = existingAssignment?.invitation_state || existingAssignment?.status;
        return {
          ...reviewer,
          isManual: false,
          state,
          existingAssignment,
        };
      }),
      ...manualInvitations.map((reviewer) => ({
        ...reviewer,
        isManual: true,
        state: reviewer.status,
        existingAssignment: reviewerAssignmentsByEmail.get(String(reviewer.email || '').trim().toLowerCase()),
      })),
    ];
  }, [article?.reviewer_preferences, reviewerAssignmentsByEmail]);

  const loadAssignees = async (role) => {
    if (assignees[role] || !article?.magazine_id) return;
    try {
      const res = await api.get('/admin/workflow/assignees', {
        params: { role, magazine_id: article.magazine_id },
      });
      setAssignees((prev) => ({ ...prev, [role]: res.data?.data || [] }));
    } catch (err) {
      logError(`Failed to load ${role} assignees`, err);
    }
  };

  const loadTransferTargets = async () => {
    if (!article?.id || transferTargets.length) return;
    try {
      const res = await api.get(`/articles/${article.id}/transfer-target-magazines`);
      setTransferTargets(res.data?.data || []);
    } catch (err) {
      logError('Failed to load transfer target magazines', err);
      toast(safeApiMessage(err, 'Unable to load transfer target magazines.'), 'error');
    }
  };

  useEffect(() => {
    if (!article?.id) return;
    if (canEditorial) loadAssignees('sub_editor');
    if (canAssignReviewer) loadAssignees('reviewer');
    if (canAssignProduction) {
      loadAssignees('copy_editor');
    }
  }, [article?.id, canEditorial, canAssignReviewer, canAssignProduction]);

  const runAction = async (key, request, successMessage) => {
    setBusyAction(key);
    try {
      await request();
      toast(successMessage, 'success');
      await onWorkflowChanged();
    } catch (err) {
      logError(err);
      toast(safeApiMessage(err, 'Workflow action failed.'), 'error');
    } finally {
      setBusyAction('');
      setConfirmAction(null);
    }
  };

  const askConfirmation = (action) => setConfirmAction(action);

  const buildFormData = (payload, fileMap = {}) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      formData.append(key, typeof value === 'object' && !(value instanceof File) ? JSON.stringify(value) : value);
    });
    Object.entries(fileMap).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });
    return formData;
  };

  const buildDirectUploadFormData = async (payload, uploadMap = {}) => {
    const formData = buildFormData(payload);
    for (const [field, config] of Object.entries(uploadMap)) {
      if (!config.file) continue;
      const upload = await uploadAndAwaitClean({
        file: config.file,
        purpose: config.purpose,
        attachableId: article.id,
        extra: config.extra || {},
      });
      formData.append(field, upload.id);
    }
    return formData;
  };

  const fileInput = (key, label) => (
    <Field label={label}>
      <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-muted)] focus-within:ring-2 focus-within:ring-[var(--focus-ring)]">
        <Upload className="h-4 w-4" aria-hidden="true" />
        <span>{files[key]?.name || 'Choose file'}</span>
        <input type="file" className="sr-only" onChange={(event) => setFiles((prev) => ({ ...prev, [key]: event.target.files?.[0] || null }))} />
      </label>
    </Field>
  );

  const updateQuestionnaireAnswer = (question, value) => {
    setQuestionnaireResponses((prev) => ({ ...prev, [question.id]: value }));
    if (question.prompt?.toLowerCase() === 'final decision') {
      setReviewForm((prev) => ({
        ...prev,
        recommendation: value === 'moderate_revision' ? 'major_revision' : value,
      }));
    }
  };

  const reviewerAssignmentForEmail = (email) => {
    const normalized = String(email || '').trim().toLowerCase();
    return normalized ? reviewerAssignmentsByEmail.get(normalized) || null : null;
  };

  const questionnairePayload = () => reviewerQuestions.map((question) => ({
    question_id: Number(question.id),
    answer: questionnaireResponses[question.id] ?? question.answer ?? '',
    comment: questionnaireComments[question.id] ?? question.comment ?? '',
  }));

  const validateAction = (schema, values) => {
    const validation = validateWithZod(schema, values);
    if (!validation.success) {
      toast(Object.values(validation.errors)[0] || validation.message, 'error');
      return false;
    }
    return true;
  };

  const reviewSubmissionPayload = () => ({
    recommendation: reviewForm.recommendation,
    comments_for_author: reviewForm.comments_for_author,
    confidential_comments: reviewForm.confidential_comments,
    questionnaire_responses: questionnairePayload(),
  });

  const validateReviewSubmission = () => {
    const requiredQuestionIds = (myReviewerAssignment?.questionnaire_instance?.questions || [])
      .filter((question) => question.is_required)
      .map((question) => question.id);
    return validateAction(reviewerWorkflowSubmitSchemaFor(requiredQuestionIds), reviewSubmissionPayload());
  };

  const status = article.status;
  const inScope = (...scopes) => !actionScope || scopes.includes(actionScope);
  const canScreen = inScope('editorial-decision') && canEditorial && ['submitted', 'pending', 'screening'].includes(status);
  const pendingTransferRequest = article?.pending_transfer_request;
  const publicationLabel = article?.publication_type === 'journal' || article?.magazine?.publication_type === 'journal' ? 'Journal' : 'Magazine';
  const canRequestTransfer = Boolean(article?.can_request_transfer) && canScreen;
  const canRespondTransferRequest = inScope('editorial-decision') && Boolean(article?.can_respond_transfer_request)
    && status === 'in_transit'
    && pendingTransferRequest?.status === 'pending';
  const canAssignSubEditor = inScope('editorial-decision') && canEditorial && ['under_review', 'resubmitted'].includes(status);
  const showReviewerWorkspace = actionScope === 'reviewers';
  const reviewerLifecycleAllowsManagement = ['under_review', 'assigned_to_sub_editor', 'reviewer_assigned', 'review_in_progress', 'resubmitted'].includes(status);
  const canManageReviewers = showReviewerWorkspace && (reviewerCanManage ?? (canAssignReviewer && reviewerLifecycleAllowsManagement));
  const canShowReviewerAssignment = showReviewerWorkspace;
  const canFinalDecision = inScope('final-editorial-decision') && canEditorial && REVIEWABLE_STATUSES.has(status);
  const canShowPublish = !actionScope && canPublish && PUBLISHABLE_STATUSES.has(status);
  const canPostPublication = !actionScope && canPublish && status === 'published';
  const canShowProductionAssignment = inScope('copy-editing') && canAssignProduction
    && productionStatuses.has(status)
    && !hasCopyEditorAssignment;
  const canAuthorFinalReview = inScope('proofreading') && Boolean(article?.can_author_final_review);
  const canCompleteProduction = inScope('copy-editing') && (isAdmin || isCopyEditor) && myProductionAssignment;
  const productionTaskLabel = myProductionAssignment?.role === 'copy_editor'
    ? 'Copyediting Task'
    : 'Production Task';
  const productionFileLabel = 'Copyedited Manuscript';
  const productionCompleteLabel = myProductionAssignment?.role === 'copy_editor'
    ? 'Mark Copyediting Complete'
    : 'Complete Task';
  const productionCompleteMessage = myProductionAssignment?.role === 'copy_editor'
    ? 'This will send the copyedited manuscript to the author for a 14-day publication approval window.'
    : 'This will mark your production task as complete and move the manuscript toward publication readiness.';

  useEffect(() => {
    if (canRequestTransfer) loadTransferTargets();
  }, [canRequestTransfer, article?.id]);

  const showSubEditorAction = inScope('sub-editor-recommendation') && isSubEditor && mySubEditorAssignment;
  const showReviewerAction = inScope('reviewers') && isReviewer && myReviewerAssignment;
  const showCompletedProduction = inScope('copy-editing') && completedProductionAssignment;
  const hasAnyAction = canScreen || canRespondTransferRequest || canAssignSubEditor || showReviewerWorkspace || showSubEditorAction
    || showReviewerAction || canFinalDecision || canAuthorFinalReview || canShowProductionAssignment || canCompleteProduction
    || showCompletedProduction || canShowPublish || canPostPublication;

  if (hideIfNoAction && !hasAnyAction) {
    return null;
  }

  return (
    <WorkflowSection
      title={{
        'editorial-decision': 'Editorial Decision Actions',
        'sub-editor-recommendation': 'Sub Editor Actions',
        reviewers: 'Reviewer Actions',
        'final-editorial-decision': 'Final Editorial Decision',
        'copy-editing': 'Copy Editing Actions',
        proofreading: 'Proofreading Actions',
      }[actionScope] || 'Workflow Actions'}
      description=""
      icon={ClipboardCheck}
    >
      <div className="space-y-4">
        {!hasAnyAction && (
          <EmptyState title="No action available">Your role has no workflow action for this manuscript right now.</EmptyState>
        )}

        {status === 'in_transit' && (
          <Alert tone="warning" title="Article in transit">
            This manuscript is waiting for the author to accept or reject a magazine transfer request. Normal editorial workflow actions are paused until the request is resolved.
          </Alert>
        )}

        {canScreen && (
          <ActionBlock title="Editorial Screening" description={`Decide whether this manuscript moves into review, is rejected during screening, or should be transferred to another ${publicationLabel}.`}>
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Editorial Action" required>
                <Select value={screenForm.decision} onChange={(event) => setScreenForm({ ...screenForm, decision: event.target.value })}>
                  <option value="send_to_review">Send for Screening</option>
                  {canRequestTransfer && <option value="transfer">Transfer Article</option>}
                  <option value="reject">Reject at Screening</option>
                </Select>
              </Field>
              {screenForm.decision !== 'transfer' && (
                <>
                  <Field label="Similarity Status">
                    <Input value={screenForm.plagiarism_status} onChange={(event) => setScreenForm({ ...screenForm, plagiarism_status: event.target.value })} />
                  </Field>
                  <Field label="Similarity Score">
                    <Input type="number" min="0" max="100" value={screenForm.plagiarism_score} onChange={(event) => setScreenForm({ ...screenForm, plagiarism_score: event.target.value })} />
                  </Field>
                </>
              )}
            </div>
            {screenForm.decision === 'transfer' ? (
              <>
                <Alert tone="info" title="Transfer requires author approval">
                  The author will receive a request to accept or reject the proposed {publicationLabel.toLowerCase()} transfer. The manuscript will move to In Transit while waiting.
                </Alert>
                <Field label={`Target ${publicationLabel}`} required>
                  <Select value={transferForm.to_magazine_id} onChange={(event) => setTransferForm({ ...transferForm, to_magazine_id: event.target.value })}>
                    <option value="">Select target {publicationLabel.toLowerCase()}</option>
                    {transferTargets.map((magazine) => (
                      <option key={magazine.id} value={magazine.id}>{magazine.name || magazine.title}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Transfer Comments" required>
                  <Textarea value={transferForm.editor_comments} onChange={(event) => setTransferForm({ ...transferForm, editor_comments: event.target.value })} rows={4} />
                </Field>
                <Button
                  type="button"
                  icon={ArrowRightLeft}
                  isLoading={busyAction === 'transfer-request'}
                  onClick={() => {
                    if (!validateAction(articleTransferRequestSchema, transferForm)) return;
                    askConfirmation({
                      key: 'transfer-request',
                      title: 'Send transfer request?',
                      message: 'This will pause normal editorial workflow and ask the author to approve moving the manuscript to the selected magazine.',
                      confirmText: 'Submit Transfer Request',
                      variant: 'primary',
                      run: () => runAction('transfer-request', () => api.post(`/articles/${article.id}/transfer-requests`, {
                        to_magazine_id: Number(transferForm.to_magazine_id),
                        editor_comments: transferForm.editor_comments,
                      }), 'Transfer request sent to the author.'),
                    });
                  }}
                >
                  Submit Transfer Request
                </Button>
              </>
            ) : (
              <>
                <Field label="Comments for Author" required={screenForm.decision === 'reject'}>
                  <Textarea value={screenForm.comments} onChange={(event) => setScreenForm({ ...screenForm, comments: event.target.value })} rows={3} />
                </Field>
                {fileInput('plagiarism_report', 'Similarity Report')}
                <Button
                  type="button"
                  icon={ClipboardCheck}
                  isLoading={busyAction === 'screen'}
                  disabled={screenForm.decision === 'reject' && !screenForm.comments.trim()}
                  onClick={() => {
                    if (!validateAction(workflowScreeningSchema, screenForm)) return;
                    askConfirmation({
                      key: 'screen',
                      title: screenForm.decision === 'reject' ? 'Reject during screening?' : 'Send manuscript to review?',
                      message: screenForm.decision === 'reject'
                        ? 'This will reject the manuscript during screening and notify the author-facing workflow with your reason.'
                        : 'This will move the manuscript into editorial review.',
                      confirmText: screenForm.decision === 'reject' ? 'Reject Manuscript' : 'Send to Review',
                      variant: screenForm.decision === 'reject' ? 'danger' : 'primary',
                      run: () => runAction('screen', async () => api.post(`/admin/articles/${article.id}/screen`, await buildDirectUploadFormData({
                        ...screenForm,
                        plagiarism_score: screenForm.plagiarism_score === '' ? null : Number(screenForm.plagiarism_score),
                      }, {
                        plagiarism_report_upload_id: {
                          file: files.plagiarism_report,
                          purpose: 'article_plagiarism_report',
                        },
                      }), { headers: { 'Content-Type': 'multipart/form-data' } }), 'Screening result saved.'),
                    });
                  }}
                >
                  Save Screening
                </Button>
              </>
            )}
          </ActionBlock>
        )}

        {(canAssignSubEditor || canShowReviewerAssignment) && (
          <ActionBlock title={actionScope === 'reviewers' ? null : 'Assignments'} description={actionScope === 'reviewers' ? null : 'Assign the next person responsible for editorial review work.'}>
            <div className="grid gap-4 md:grid-cols-2">
              {canAssignSubEditor && (
                <div className="space-y-2">
                  <Field label="Sub Editor">
                    <Select value={subEditorId} onChange={(event) => setSubEditorId(event.target.value)}>
                      <option value="">Select Sub Editor</option>
                      {(assignees.sub_editor || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </Select>
                  </Field>
                  <Button
                    type="button"
                    icon={UserPlus}
                    isLoading={busyAction === 'assign-sub-editor'}
                    disabled={!subEditorId}
	                    onClick={() => {
	                      if (!validateAction(workflowAssigneeSchema, { assignee_id: subEditorId })) return;
	                      askConfirmation({
	                      key: 'assign-sub-editor',
	                      title: 'Assign Sub Editor?',
                      message: 'This will assign the selected Sub Editor and move the manuscript into Sub Editor review.',
                      confirmText: 'Assign Sub Editor',
                      variant: 'primary',
	                      run: () => runAction('assign-sub-editor', () => api.post(`/admin/articles/${article.id}/assign-sub-editor`, { sub_editor_id: Number(subEditorId) }), 'Sub Editor assigned.'),
	                    });
	                    }}
                  >
                    Assign Sub Editor
                  </Button>
                </div>
              )}
              {canShowReviewerAssignment && (
                <div className="space-y-4 md:col-span-2">
                  <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{REVIEWER_WORKSPACE_SECTIONS[0]}</p>
                    {allReviewersToShow.length > 0 ? (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {allReviewersToShow.map((reviewer) => {
                          const assignment = reviewer.existingAssignment;
                          const showReminder = assignment && reviewer.state === 'invited';
                          const showResend = assignment && reviewer.state === 'declined';
                          return (
                          <div key={reviewer.isManual ? 'manual-' + reviewer.id : 'suggested-' + (reviewer.id || reviewer.email)} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex flex-col justify-between">
                            <div className="flex flex-col gap-2">
                              <div>
                                <p className="text-sm font-bold text-[var(--foreground)]">{reviewer.name}</p>
                                <p className="text-xs text-[var(--muted)] break-all">{reviewer.email}{reviewer.affiliation ? ` · ${reviewer.affiliation}` : ''}</p>
                              </div>
                              {reviewer.isManual ? (
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="inline-flex items-center rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                                    Manual Invite
                                  </span>
                                  {reviewer.state && (
                                    <span className="inline-flex items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                      {reviewer.state === 'completed' ? 'Review Completed' : labelize(reviewer.state)}
                                    </span>
                                  )}
                                  {canManageReviewers && showReminder && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="secondary"
                                      icon={Bell}
                                      isLoading={busyAction === `remind-${assignment.id}`}
                                      onClick={() => {
                                        askConfirmation({
                                          key: `remind-${assignment.id}`,
                                          title: 'Resend reviewer invitation?',
                                          message: 'This will resend the existing secure invitation without creating a duplicate assignment.',
                                          confirmText: 'Resend Invite',
                                          variant: 'primary',
                                          run: () => runAction(`remind-${assignment.id}`, () => api.post(`/admin/reviewer-assignments/${assignment.id}/remind`), 'Reminder email sent.'),
                                        });
                                      }}
                                    >
                                      Resend Invite
                                    </Button>
                                  )}
                                  {canManageReviewers && showResend && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      icon={UserPlus}
                                      isLoading={busyAction === `resend-${assignment.id}`}
                                      onClick={() => {
                                        const invitation = {
                                          name: reviewer.name,
                                          email: reviewer.email,
                                          affiliation: reviewer.affiliation || '',
                                        };
                                        if (!validateAction(workflowManualReviewerSchema, invitation)) return;
                                        askConfirmation({
                                          key: `resend-${assignment.id}`,
                                          title: 'Resend reviewer invitation?',
                                          message: 'This will send a fresh secure invitation to the reviewer who previously declined.',
                                          confirmText: 'Reinvite',
                                          variant: 'primary',
                                          run: () => runAction(`resend-${assignment.id}`, () => api.post(`/admin/articles/${article.id}/assign-reviewer`, invitation), 'Reviewer invitation resent.'),
                                        });
                                      }}
                                    >
                                      Reinvite
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {reviewer.state && (
                                    <span className="inline-flex items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                      {reviewer.state === 'completed' ? 'Review Completed' : labelize(reviewer.state)}
                                    </span>
                                  )}
                                  {canManageReviewers && showReminder && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="secondary"
                                      icon={Bell}
                                      isLoading={busyAction === `remind-${assignment.id}`}
                                      onClick={() => {
                                        askConfirmation({
                                          key: `remind-${assignment.id}`,
                                          title: 'Resend reviewer invitation?',
                                          message: 'This will resend the existing secure invitation without creating a duplicate assignment.',
                                          confirmText: 'Resend Invite',
                                          variant: 'primary',
                                          run: () => runAction(`remind-${assignment.id}`, () => api.post(`/admin/reviewer-assignments/${assignment.id}/remind`), 'Reminder email sent.'),
                                        });
                                      }}
                                    >
                                      Resend Invite
                                    </Button>
                                  )}
                                  {canManageReviewers && (!reviewer.existingAssignment || showResend) && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      icon={UserPlus}
                                      isLoading={busyAction === `${showResend ? 'resend' : 'suggested'}-${reviewer.id}`}
                                      onClick={() => {
                                        const revisionInvitation = { name: reviewer.name, email: reviewer.email, affiliation: reviewer.affiliation || '' };
                                        if (reviewer.previously_completed_review) {
                                          if (!validateAction(workflowManualReviewerSchema, revisionInvitation)) return;
                                        } else if (!validateAction(workflowSuggestedReviewerSchema, { suggested_preference_id: reviewer.id })) return;
                                        askConfirmation({
                                          key: `${showResend ? 'resend' : 'suggested'}-${reviewer.id}`,
                                          title: showResend ? 'Resend reviewer invitation?' : reviewer.previously_completed_review ? 'Invite reviewer for this revision?' : 'Invite suggested reviewer?',
                                          message: showResend
                                            ? 'This will send a fresh secure invitation to the reviewer who previously declined.'
                                            : 'This will send a secure review invitation to the suggested reviewer.',
                                          confirmText: showResend ? 'Reinvite' : 'Send Invitation',
                                          variant: 'primary',
                                          run: () => runAction(`${showResend ? 'resend' : 'suggested'}-${reviewer.id}`, () => api.post(`/admin/articles/${article.id}/assign-reviewer`, reviewer.previously_completed_review ? revisionInvitation : { suggested_preference_id: reviewer.id }), showResend ? 'Reviewer invitation resent.' : 'Reviewer invitation sent.'),
                                        });
                                      }}
                                    >
                                      {showResend ? 'Reinvite' : reviewer.previously_completed_review ? 'Invite for Revision Review' : 'Invite'}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    ) : <p className="text-sm text-[var(--muted)]">No suggested reviewers are available for this version.</p>}
                  </div>

                  <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{REVIEWER_WORKSPACE_SECTIONS[1]}</p>
                    {(article.reviewer_preferences?.opposed || []).length > 0 ? (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {article.reviewer_preferences.opposed.map((reviewer) => (
                          <div key={reviewer.id || reviewer.email} className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                            <p className="text-sm font-bold text-[var(--foreground)]">{reviewer.name}</p>
                            <p className="text-xs text-[var(--muted)]">{reviewer.email}{reviewer.affiliation ? ` · ${reviewer.affiliation}` : ''}</p>
                            <p className="mt-1 text-xs font-semibold text-rose-700 dark:text-rose-300">Blocked from assignment</p>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-[var(--muted)]">No opposed reviewers were submitted for this version.</p>}
                  </div>

                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{REVIEWER_WORKSPACE_SECTIONS[2]}</p>
                    {canManageReviewers ? <><div className="grid gap-3 md:grid-cols-3">
                      <Field label="Name"><Input value={manualReviewer.name} onChange={(event) => setManualReviewer({ ...manualReviewer, name: event.target.value })} /></Field>
	                    <Field label="Email"><Input type="text" value={manualReviewer.email} onChange={(event) => setManualReviewer({ ...manualReviewer, email: event.target.value })} /></Field>
                      <Field label="Affiliation"><Input value={manualReviewer.affiliation} onChange={(event) => setManualReviewer({ ...manualReviewer, affiliation: event.target.value })} /></Field>
                    </div>
                    <Button
                      type="button"
                      className="mt-3"
                      icon={UserPlus}
                      isLoading={busyAction === 'manual-reviewer'}
                      disabled={!manualReviewer.email.trim() || Boolean(reviewerAssignmentForEmail(manualReviewer.email))}
	                      onClick={() => {
	                        if (!validateAction(workflowManualReviewerSchema, manualReviewer)) return;
	                        askConfirmation({
	                        key: 'manual-reviewer',
                        title: 'Invite manual reviewer?',
                        message: 'This will send a secure review invitation if backend conflict checks pass.',
                        confirmText: 'Send Invitation',
                        variant: 'primary',
	                        run: () => runAction('manual-reviewer', () => api.post(`/admin/articles/${article.id}/assign-reviewer`, manualReviewer), 'Reviewer invitation sent.'),
	                      });
	                      }}
                    >
                      {reviewerAssignmentForEmail(manualReviewer.email)?.invitation_state ? labelize(reviewerAssignmentForEmail(manualReviewer.email).invitation_state) : 'Send Manual Invitation'}
                    </Button>
                    </> : <p className="text-sm text-[var(--muted)]">Manual invitation is unavailable for this version or your current permissions.</p>}
                  </div>
                </div>
              )}
            </div>
          </ActionBlock>
        )}

        {showSubEditorAction && mySubEditorAssignment.status !== 'completed' && (
          <ActionBlock title="Sub Editor Recommendation" description="Submit your recommendation back to the Editor.">
            <Field label="Recommendation" required>
              <Select value={subEditorForm.recommendation} onChange={(event) => setSubEditorForm({ ...subEditorForm, recommendation: event.target.value })}>
                {recommendationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </Field>
            <Field label="Comments for Author">
              <Textarea value={subEditorForm.comments} onChange={(event) => setSubEditorForm({ ...subEditorForm, comments: event.target.value })} rows={3} />
            </Field>
            <Field label="Internal Notes">
              <Textarea value={subEditorForm.internal_notes} onChange={(event) => setSubEditorForm({ ...subEditorForm, internal_notes: event.target.value })} rows={3} />
            </Field>
            {fileInput('annotated_manuscript', 'Annotated Manuscript')}
            <Button
              type="button"
              icon={Send}
              isLoading={busyAction === 'sub-editor-recommendation'}
	              onClick={() => {
	                if (!validateAction(subEditorRecommendationSchema, subEditorForm)) return;
	                askConfirmation({
	                key: 'sub-editor-recommendation',
                title: 'Submit recommendation?',
                message: 'This will record your recommendation and return the manuscript to editorial review.',
                confirmText: 'Submit Recommendation',
                variant: 'primary',
	                run: () => runAction('sub-editor-recommendation', async () => api.post(`/admin/sub-editor-assignments/${mySubEditorAssignment.id}/submit-recommendation`, await buildDirectUploadFormData(subEditorForm, {
                  annotated_manuscript_upload_id: {
                    file: files.annotated_manuscript,
                    purpose: 'article_annotated_manuscript',
                    extra: { assignment_type: 'sub_editor_assignment', assignment_id: mySubEditorAssignment.id },
                  },
	                }), { headers: { 'Content-Type': 'multipart/form-data' } }), 'Recommendation submitted.'),
	              });
	              }}
            >
              Submit Recommendation
            </Button>
          </ActionBlock>
        )}

        {showReviewerAction && myReviewerAssignment.status !== 'completed' && (
          <ActionBlock title="Reviewer Work" description="Accept your invitation, then submit your review and recommendation.">
            {myReviewerAssignment.status === 'pending' ? (
              <>
                <Alert tone="info" title="Review invitation pending">Accept the invitation before submitting a review.</Alert>
                <Button
                  type="button"
                  icon={CheckCircle2}
                  isLoading={busyAction === 'accept-review'}
	                  onClick={() => {
	                    if (!validateAction(productionCompletionSchema, { assignment_id: myReviewerAssignment.id })) return;
	                    askConfirmation({
	                    key: 'accept-review',
                    title: 'Accept review invitation?',
                    message: 'This will mark the review as accepted and move the manuscript into active review.',
                    confirmText: 'Accept Review',
                    variant: 'primary',
	                    run: () => runAction('accept-review', () => api.post(`/admin/reviewer-assignments/${myReviewerAssignment.id}/accept`), 'Review assignment accepted.'),
	                  });
	                  }}
                >
                  Accept Review
                </Button>
              </>
            ) : (
              <>
                {!hasQuestionnaireFinalDecision && (
                  <Field label="Recommendation" required>
                    <Select value={reviewForm.recommendation} onChange={(event) => setReviewForm({ ...reviewForm, recommendation: event.target.value })}>
                      {recommendationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </Select>
                  </Field>
                )}
                <Field label="Comments for Author">
                  <Textarea value={reviewForm.comments_for_author} onChange={(event) => setReviewForm({ ...reviewForm, comments_for_author: event.target.value })} rows={3} />
                </Field>
                <Field label="Confidential Comments for Editor">
                  <Textarea value={reviewForm.confidential_comments} onChange={(event) => setReviewForm({ ...reviewForm, confidential_comments: event.target.value })} rows={3} />
                </Field>
                {myReviewerAssignment.questionnaire_instance?.questions?.length > 0 && (
                  <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="text-sm font-bold text-[var(--foreground)]">Reviewer Questionnaire</p>
                    {myReviewerAssignment.questionnaire_instance.questions.map((question) => (
                      <div key={question.id} className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                      <Field label={question.prompt} required={question.is_required}>
                        {question.response_type === 'textarea' ? (
                          <Textarea value={questionnaireResponses[question.id] || question.answer || ''} onChange={(event) => updateQuestionnaireAnswer(question, event.target.value)} rows={3} />
                        ) : question.response_type === 'single_line' ? (
                          <Input value={questionnaireResponses[question.id] || question.answer || ''} onChange={(event) => updateQuestionnaireAnswer(question, event.target.value)} />
                        ) : question.response_type === 'checkbox' ? (
                          <div className="flex flex-wrap gap-2">
                            {(question.options || []).map((option) => {
                              const val = typeof option === 'object' && option !== null ? option.value : option;
                              const lbl = typeof option === 'object' && option !== null ? option.label : option;
                              const rawCurrent = questionnaireResponses[question.id] ?? question.answer ?? [];
                              const current = Array.isArray(rawCurrent) ? rawCurrent : [];
                              const checked = current.includes(val);
                              return (
                                <label key={val} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm cursor-pointer hover:bg-[var(--surface-muted)] transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(event) => {
                                      const next = event.target.checked ? [...current, val] : current.filter((item) => item !== val);
                                      updateQuestionnaireAnswer(question, next);
                                    }}
                                  />
                                  {lbl}
                                </label>
                              );
                            })}
                          </div>
                        ) : question.response_type === 'radio' ? (
                          <div className="flex flex-wrap gap-4">
                            {(question.options || []).map((option) => {
                              const val = typeof option === 'object' && option !== null ? option.value : option;
                              const lbl = typeof option === 'object' && option !== null ? option.label : option;
                              const checked = (questionnaireResponses[question.id] ?? question.answer) === val;
                              return (
                                <label key={val} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm cursor-pointer hover:bg-[var(--surface-muted)] transition-colors">
                                  <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    value={val}
                                    checked={checked}
                                    onChange={() => updateQuestionnaireAnswer(question, val)}
                                  />
                                  {lbl}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <Select value={questionnaireResponses[question.id] || question.answer || ''} onChange={(event) => updateQuestionnaireAnswer(question, event.target.value)}>
                            <option value="">Select</option>
                            {(question.options || []).map((option) => {
                              const val = typeof option === 'object' && option !== null ? option.value : option;
                              const lbl = typeof option === 'object' && option !== null ? option.label : option;
                              return <option key={val} value={val}>{lbl}</option>;
                            })}
                          </Select>
                        )}
                      </Field>
                      {question.comment_helper && (
                        <Field label="Comment or suggested modification">
                          <Textarea
                            value={questionnaireComments[question.id] ?? question.comment ?? ''}
                            onChange={(event) => setQuestionnaireComments((prev) => ({ ...prev, [question.id]: event.target.value }))}
                            rows={2}
                            placeholder={question.comment_helper}
                          />
                        </Field>
                      )}
                      </div>
                    ))}
                  </div>
                )}
                {fileInput('reviewed_manuscript', 'Reviewed Manuscript')}
                <Button
                  type="button"
                  icon={Send}
                  isLoading={busyAction === 'submit-review'}
	                  onClick={() => {
	                    if (!validateReviewSubmission()) return;
	                    askConfirmation({
	                    key: 'submit-review',
                    title: 'Submit review?',
                    message: 'This will mark your review as completed and return the manuscript to editorial review.',
                    confirmText: 'Submit Review',
                    variant: 'primary',
	                    run: () => runAction('submit-review', async () => api.post(`/admin/reviewer-assignments/${myReviewerAssignment.id}/submit-review`, await buildDirectUploadFormData(reviewSubmissionPayload(), {
	                      reviewed_manuscript_upload_id: {
	                        file: files.reviewed_manuscript,
                        purpose: 'article_reviewed_manuscript',
                        extra: { assignment_type: 'reviewer_assignment', assignment_id: myReviewerAssignment.id },
                      },
	                    }), { headers: { 'Content-Type': 'multipart/form-data' } }), 'Review submitted.'),
	                  });
	                  }}
                >
                  Submit Review
                </Button>
              </>
            )}
          </ActionBlock>
        )}

        {canFinalDecision && (
          <ActionBlock title="Editorial Decision" description="Record the next editorial outcome for the manuscript.">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Decision" required>
                <Select value={decisionForm.decision} onChange={(event) => setDecisionForm({ ...decisionForm, decision: event.target.value })}>
                  {decisionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              </Field>
              <Field label="Decision Source" required>
                <Select value={decisionForm.decision_source} onChange={(event) => setDecisionForm({ ...decisionForm, decision_source: event.target.value })}>
                  {decisionSourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Comments for Author">
              <Textarea value={decisionForm.comments_for_author} onChange={(event) => setDecisionForm({ ...decisionForm, comments_for_author: event.target.value })} rows={3} />
            </Field>
            <Field label="Internal Notes">
              <Textarea value={decisionForm.internal_notes} onChange={(event) => setDecisionForm({ ...decisionForm, internal_notes: event.target.value })} rows={3} />
            </Field>
            <Button
              type="button"
              icon={FileCheck2}
              isLoading={busyAction === 'final-decision'}
	              onClick={() => {
	                if (!validateAction(finalEditorialDecisionSchema, decisionForm)) return;
	                askConfirmation({
	                key: 'final-decision',
                title: 'Record editorial decision?',
                message: decisionForm.decision === 'accepted'
                  ? 'This will mark the manuscript as accepted and make it available for production or publication handling.'
                  : decisionForm.decision === 'rejected'
                    ? 'This will reject the manuscript and close the editorial workflow for the author.'
                    : 'This will request a revision from the author and move the manuscript into the revision stage.',
                confirmText: 'Record Decision',
                variant: decisionForm.decision === 'rejected' ? 'danger' : 'primary',
	                run: () => runAction('final-decision', () => api.post(`/admin/articles/${article.id}/final-decision`, decisionForm), 'Final decision recorded.'),
	              });
	              }}
            >
              Record Decision
            </Button>
          </ActionBlock>
        )}

        {canRespondTransferRequest && (
          <ActionBlock title="Magazine Transfer Request" description="Review the editor’s proposed transfer and choose whether this manuscript should move to the suggested magazine.">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Current Magazine</p>
                <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{pendingTransferRequest.from_magazine?.title || article.magazine?.title || 'Current magazine'}</p>
              </div>
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Suggested Magazine</p>
                <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{pendingTransferRequest.to_magazine?.title || 'Suggested magazine'}</p>
              </div>
            </div>
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--muted)]">
              <p><span className="font-semibold text-[var(--foreground)]">Requested by:</span> {pendingTransferRequest.requested_by?.name || 'Editorial team'}</p>
              <p><span className="font-semibold text-[var(--foreground)]">Requested at:</span> {pendingTransferRequest.requested_at ? new Date(pendingTransferRequest.requested_at).toLocaleString() : 'Not recorded'}</p>
              <p className="mt-2 whitespace-pre-line"><span className="font-semibold text-[var(--foreground)]">Editor comments:</span> {pendingTransferRequest.editor_comments || 'No comments provided.'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                icon={CheckCircle2}
                isLoading={busyAction === 'transfer-accept'}
                onClick={() => askConfirmation({
                  key: 'transfer-accept',
                  title: 'Accept magazine transfer?',
                  message: 'This will move the manuscript to the suggested magazine and return it to Screening.',
                  confirmText: 'Accept Transfer',
                  variant: 'primary',
                  run: () => runAction('transfer-accept', () => api.post(`/articles/${article.id}/transfer-requests/${pendingTransferRequest.id}/accept`), 'Transfer accepted.'),
                })}
              >
                Accept Transfer
              </Button>
              <Button
                type="button"
                icon={XCircle}
                variant="secondary"
                isLoading={busyAction === 'transfer-reject'}
                onClick={() => {
                  if (!validateAction(articleTransferRejectSchema, transferRejectForm)) return;
                  askConfirmation({
                    key: 'transfer-reject',
                    title: 'Reject magazine transfer?',
                    message: 'This will keep the manuscript in the current magazine and return it to Screening.',
                    confirmText: 'Reject Transfer',
                    variant: 'danger',
                    run: () => runAction('transfer-reject', () => api.post(`/articles/${article.id}/transfer-requests/${pendingTransferRequest.id}/reject`, transferRejectForm), 'Transfer rejected.'),
                  });
                }}
              >
                Reject Transfer
              </Button>
            </div>
            <Field label="Rejection Reason" required>
              <Textarea value={transferRejectForm.author_rejection_reason} onChange={(event) => setTransferRejectForm({ author_rejection_reason: event.target.value })} rows={3} />
            </Field>
          </ActionBlock>
        )}

        {canAuthorFinalReview && (
          <ActionBlock title="Author Publication Review" description="Approve the copyedited article or return it to copyediting.">
            <Alert tone="info" title="Copyediting complete">
              Review the copyedited article before publication. If no response is received by {article.author_final_review_due_at ? new Date(article.author_final_review_due_at).toLocaleDateString() : 'the 14-day deadline'}, approval will be recorded automatically.
            </Alert>
            <Field label="Reason for returning to copyediting">
              <Textarea
                value={authorFinalReason}
                onChange={(event) => setAuthorFinalReason(event.target.value)}
                rows={3}
                placeholder="Required only when publication is denied"
              />
            </Field>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                icon={FileCheck2}
                isLoading={busyAction === 'author-final-approve'}
                onClick={() => askConfirmation({
                  key: 'author-final-approve',
                  title: 'Approve publication?',
                  message: 'This will mark the article ready for publication.',
                  confirmText: 'Approve Publication',
                  variant: 'primary',
                  run: () => runAction('author-final-approve', () => api.post(`/admin/articles/${article.id}/author-final-review`, { decision: 'accepted' }), 'Publication approved.'),
                })}
              >
                Approve Publication
              </Button>
              <Button
                type="button"
                icon={XCircle}
                variant="danger"
                isLoading={busyAction === 'author-final-deny'}
                disabled={!authorFinalReason.trim()}
                onClick={() => askConfirmation({
                  key: 'author-final-deny',
                  title: 'Return to copyediting?',
                  message: 'Publication will be denied for now and the copy editor will receive your requested changes.',
                  confirmText: 'Deny Publication',
                  variant: 'danger',
                  run: () => runAction('author-final-deny', () => api.post(`/admin/articles/${article.id}/author-final-review`, { decision: 'denied', reason: authorFinalReason.trim() }), 'Article returned to copyediting.'),
                })}
              >
                Deny Publication
              </Button>
            </div>
          </ActionBlock>
        )}

        {canShowProductionAssignment && (
          <ActionBlock title="Production Assignment" description="Assign copyediting work for the accepted manuscript.">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Production Role">
                <Select
                  value={productionForm.role}
                  onChange={(event) => {
                    setProductionForm({ ...productionForm, role: event.target.value, user_id: '' });
                    loadAssignees(event.target.value);
                  }}
                >
	              <option value="copy_editor">Copy Editor</option>
                </Select>
              </Field>
              <Field label="Assignee">
                <Select value={productionForm.user_id} onChange={(event) => setProductionForm({ ...productionForm, user_id: event.target.value })}>
                  <option value="">Select assignee</option>
                  {(assignees[productionForm.role] || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
              </Field>
              <Field label="Due Date">
                <FlatpickrInput value={productionForm.due_date} onChange={(value) => setProductionForm({ ...productionForm, due_date: value })} aria-label="Production due date" />
              </Field>
            </div>
            <Button
              type="button"
              icon={UserPlus}
              isLoading={busyAction === 'assign-production'}
              disabled={!productionForm.user_id}
	                onClick={() => {
	                  if (!validateAction(productionAssignmentSchema, productionForm)) return;
	                  askConfirmation({
	                key: 'assign-production',
	                title: 'Send to copyediting?',
	                message: 'This will assign copyediting work and move the manuscript into copyediting.',
                confirmText: 'Assign Production',
                variant: 'primary',
	                run: () => runAction('assign-production', () => api.post(`/admin/articles/${article.id}/production-assignments`, {
	                  user_id: Number(productionForm.user_id),
                  role: productionForm.role,
                  due_date: productionForm.due_date || null,
	                }), 'Production assignment created.'),
	              });
	                }}
            >
              Assign Production
            </Button>
          </ActionBlock>
        )}

        {canCompleteProduction && (
          <ActionBlock title={`My ${productionTaskLabel}`} description={myProductionAssignment.role === 'copy_editor' ? 'Review the permitted manuscript files, upload a copyedited file if needed, then mark copyediting complete.' : 'Complete your assigned production work when the manuscript file is ready.'}>
            <p className="text-sm text-[var(--muted)]">Current task: {myProductionAssignment.role?.replaceAll('_', ' ')}.</p>
            {fileInput('production_file', productionFileLabel)}
            <Button
              type="button"
              icon={Check}
              isLoading={busyAction === 'complete-production'}
	              onClick={() => {
	                if (!validateAction(productionCompletionSchema, { assignment_id: myProductionAssignment.id })) return;
	                askConfirmation({
	                key: 'complete-production',
                title: `${productionCompleteLabel}?`,
                message: productionCompleteMessage,
                confirmText: productionCompleteLabel,
                variant: 'primary',
	                run: () => runAction('complete-production', async () => api.post(`/admin/production-assignments/${myProductionAssignment.id}/complete`, await buildDirectUploadFormData({}, {
                  production_file_upload_id: {
                    file: files.production_file,
	                    purpose: 'article_production_file',
                    extra: { assignment_type: 'production_assignment', assignment_id: myProductionAssignment.id },
                  },
	                }), { headers: { 'Content-Type': 'multipart/form-data' } }), 'Production task completed.'),
	              });
	              }}
            >
              {productionCompleteLabel}
            </Button>
          </ActionBlock>
        )}

        {!canCompleteProduction && showCompletedProduction && (
          <Alert tone="success" title="Production task complete">
            This {completedProductionAssignment.role?.replaceAll('_', ' ')} assignment is completed and read-only.
          </Alert>
        )}

        {canShowPublish && (
          <ActionBlock title="Publication" description="Finalize issue placement, publication metadata, and the published PDF where needed.">
            <Button type="button" icon={FileCheck2} onClick={onOpenPublish}>Publish Manuscript</Button>
          </ActionBlock>
        )}

        {canPostPublication && (
          <ActionBlock title="Post-Publication Action" description="Record a correction, retraction, update, archive, or unpublish action.">
            <Field label="Action Type">
              <Select value={postForm.action_type} onChange={(event) => setPostForm({ ...postForm, action_type: event.target.value })}>
                {postPublicationActions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </Field>
            <Field label="Reason" required>
              <Textarea value={postForm.reason} onChange={(event) => setPostForm({ ...postForm, reason: event.target.value })} rows={3} />
            </Field>
            <Field label="Public Notice" required>
              <Textarea value={postForm.notice_text} onChange={(event) => setPostForm({ ...postForm, notice_text: event.target.value })} rows={3} />
            </Field>
            <Button
              type="button"
              icon={FileCheck2}
              isLoading={busyAction === 'post-publication'}
              disabled={!postForm.reason.trim() || !postForm.notice_text.trim()}
	              onClick={() => {
	                if (!validateAction(postPublicationWorkflowSchema, postForm)) return;
	                askConfirmation({
	                key: 'post-publication',
                title: 'Record post-publication action?',
                message: 'This will record a public post-publication action and may change the publication state.',
                confirmText: 'Record Action',
                variant: postForm.action_type === 'retraction' || postForm.action_type === 'unpublish' ? 'danger' : 'primary',
	                run: () => runAction('post-publication', () => api.post(`/admin/articles/${article.id}/post-publication-actions`, postForm), 'Post-publication action recorded.'),
	              });
	              }}
            >
              Record Action
            </Button>
          </ActionBlock>
        )}
      </div>

      <ConfirmationModal
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmText={confirmAction?.confirmText || 'Confirm'}
        variant={confirmAction?.variant === 'danger' ? 'danger' : 'primary'}
        isLoading={busyAction === confirmAction?.key}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.run()}
      />
    </WorkflowSection>
  );
}
