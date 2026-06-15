'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, ClipboardCheck, FileCheck2, Loader2, Send, UserPlus } from 'lucide-react';
import api from '../../utils/api';
import {
  PUBLISHABLE_STATUSES,
  REJECTED_STATUSES,
  REVIEWABLE_STATUSES,
  REVISION_STATUSES,
} from './articleWorkflow';

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

function FieldLabel({ children }) {
  return <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono block">{children}</label>;
}

function PanelButton({ children, icon: Icon = Send, loading, ...props }) {
  return (
    <button
      type="button"
      disabled={loading || props.disabled}
      className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
      {...props}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      <span>{children}</span>
    </button>
  );
}

export default function WorkflowActionPanel({
  article,
  workflowContext,
  user,
  hasRole,
  hasPermission,
  onWorkflowChanged,
  onOpenPublish,
  toast,
}) {
  const [busyAction, setBusyAction] = useState('');
  const [assignees, setAssignees] = useState({});
  const [issues, setIssues] = useState([]);
  const [screenForm, setScreenForm] = useState({ decision: 'send_to_review', plagiarism_status: '', plagiarism_score: '', plagiarism_report_path: '', comments: '' });
  const [subEditorId, setSubEditorId] = useState('');
  const [reviewerId, setReviewerId] = useState('');
  const [productionForm, setProductionForm] = useState({ user_id: '', role: 'copy_editor', due_date: '' });
  const [subEditorForm, setSubEditorForm] = useState({ recommendation: 'minor_revision', comments: '', internal_notes: '' });
  const [reviewForm, setReviewForm] = useState({ recommendation: 'minor_revision', comments_for_author: '', confidential_comments: '', originality: 3, methodology: 3, citation_accuracy: 3 });
  const [decisionForm, setDecisionForm] = useState({ decision: 'accepted', decision_source: 'mixed_editorial_decision', comments_for_author: '', internal_notes: '' });
  const [postForm, setPostForm] = useState({ action_type: 'correction', reason: '', notice_text: '' });

  const isAdmin = hasRole('super_admin') || hasRole('admin');
  const isEditor = hasRole('editor') || hasRole('magazine_editor') || hasRole('magazine-editor');
  const isSubEditor = hasRole('sub_editor');
  const isReviewer = hasRole('reviewer');
  const isPublisher = hasRole('publisher');
  const isCopyEditor = hasRole('copy_editor');
  const isProofreader = hasRole('proofreader');

  const canEditorial = isAdmin || isEditor;
  const canAssignReviewer = isAdmin || isEditor || isSubEditor;
  const canPublish = isAdmin || isPublisher;
  const canAssignProduction = isAdmin || isEditor || isPublisher;

  const mySubEditorAssignment = useMemo(() => (
    (workflowContext?.sub_editor_assignments || []).find((item) => Number(item.sub_editor_id) === Number(user?.id))
  ), [workflowContext, user]);

  const myReviewerAssignment = useMemo(() => (
    (workflowContext?.reviewer_assignments || []).find((item) => Number(item.reviewer_id) === Number(user?.id))
  ), [workflowContext, user]);

  const myProductionAssignment = useMemo(() => (
    (workflowContext?.production_assignments || []).find((item) => Number(item.user_id) === Number(user?.id) && ['pending', 'in_progress'].includes(item.status))
  ), [workflowContext, user]);

  const loadAssignees = async (role) => {
    if (assignees[role]) return;
    try {
      const res = await api.get('/admin/workflow/assignees', {
        params: { role, magazine_id: article.magazine_id },
      });
      setAssignees((prev) => ({ ...prev, [role]: res.data?.data || [] }));
    } catch (err) {
      console.error(`Failed to load ${role} assignees`, err);
    }
  };

  useEffect(() => {
    if (!article?.id) return;
    if (canEditorial) {
      loadAssignees('sub_editor');
    }
    if (canAssignReviewer) {
      loadAssignees('reviewer');
    }
    if (canAssignProduction) {
      loadAssignees('copy_editor');
      loadAssignees('proofreader');
    }
  }, [article?.id, canEditorial, canAssignReviewer, canAssignProduction]);

  useEffect(() => {
    if (!canPublish || !article?.magazine_id) return;
    const loadIssues = async () => {
      try {
        const res = await api.get('/admin/issues', { params: { magazine_id: article.magazine_id, per_page: 100 } });
        setIssues(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load issues', err);
      }
    };
    loadIssues();
  }, [canPublish, article?.magazine_id]);

  const runAction = async (key, request, successMessage) => {
    setBusyAction(key);
    try {
      await request();
      toast(successMessage, 'success');
      await onWorkflowChanged();
    } catch (err) {
      console.error(err);
      toast(err.response?.data?.message || 'Workflow action failed.', 'error');
    } finally {
      setBusyAction('');
    }
  };

  const hasScreeningFields = screenForm.decision === 'reject' ? screenForm.comments.trim() : true;
  const canScreen = canEditorial && ['submitted', 'pending'].includes(article.status);
  const canFinalDecision = canEditorial && REVIEWABLE_STATUSES.has(article.status);
  const canShowPublish = canPublish && PUBLISHABLE_STATUSES.has(article.status);
  const canPostPublication = canPublish && article.status === 'published';
  const canCompleteProduction = (isAdmin || isCopyEditor || isProofreader) && myProductionAssignment;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">Workflow Actions</h3>
          <p className="text-[10px] text-zinc-450 font-medium">Only actions available to your role are shown.</p>
        </div>
      </div>

      {!canEditorial && !canAssignReviewer && !isSubEditor && !isReviewer && !canPublish && !canCompleteProduction && (
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 text-xs text-zinc-500">
          No workflow actions are available for your current role on this manuscript.
        </div>
      )}

      {canScreen && (
        <section className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-amber-600" />
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Editorial Screening</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <FieldLabel>Decision</FieldLabel>
              <select value={screenForm.decision} onChange={(e) => setScreenForm({ ...screenForm, decision: e.target.value })} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <option value="send_to_review">Send to Review</option>
                <option value="reject">Reject at Screening</option>
              </select>
            </div>
            <div className="space-y-1">
              <FieldLabel>Similarity Status</FieldLabel>
              <input value={screenForm.plagiarism_status} onChange={(e) => setScreenForm({ ...screenForm, plagiarism_status: e.target.value })} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
            </div>
            <div className="space-y-1">
              <FieldLabel>Score</FieldLabel>
              <input type="number" min="0" max="100" value={screenForm.plagiarism_score} onChange={(e) => setScreenForm({ ...screenForm, plagiarism_score: e.target.value })} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
            </div>
            <div className="space-y-1">
              <FieldLabel>Report Path</FieldLabel>
              <input value={screenForm.plagiarism_report_path} onChange={(e) => setScreenForm({ ...screenForm, plagiarism_report_path: e.target.value })} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
            </div>
          </div>
          <textarea value={screenForm.comments} onChange={(e) => setScreenForm({ ...screenForm, comments: e.target.value })} placeholder="Screening notes or rejection reason..." rows={2} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
          <PanelButton
            icon={ClipboardCheck}
            loading={busyAction === 'screen'}
            disabled={!hasScreeningFields}
            onClick={() => runAction('screen', () => api.post(`/admin/articles/${article.id}/screen`, {
              ...screenForm,
              plagiarism_score: screenForm.plagiarism_score === '' ? null : Number(screenForm.plagiarism_score),
            }), 'Screening result saved.')}
          >
            Save Screening
          </PanelButton>
        </section>
      )}

      {(canEditorial || canAssignReviewer) && (
        <section className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-600" />
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Assignments</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {canEditorial && (
              <div className="space-y-2">
                <FieldLabel>Sub Editor</FieldLabel>
                <select value={subEditorId} onChange={(e) => setSubEditorId(e.target.value)} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <option value="">Select sub editor</option>
                  {(assignees.sub_editor || []).map((item) => <option key={item.id} value={item.id}>{item.name} ({item.email})</option>)}
                </select>
                <PanelButton
                  icon={UserPlus}
                  loading={busyAction === 'assign-sub-editor'}
                  disabled={!subEditorId}
                  onClick={() => runAction('assign-sub-editor', () => api.post(`/admin/articles/${article.id}/assign-sub-editor`, { sub_editor_id: Number(subEditorId) }), 'Sub editor assigned.')}
                >
                  Assign Sub Editor
                </PanelButton>
              </div>
            )}
            <div className="space-y-2">
              <FieldLabel>Reviewer</FieldLabel>
              <select value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <option value="">Select reviewer</option>
                {(assignees.reviewer || []).map((item) => <option key={item.id} value={item.id}>{item.name} ({item.email})</option>)}
              </select>
              <PanelButton
                icon={UserPlus}
                loading={busyAction === 'assign-reviewer'}
                disabled={!reviewerId}
                onClick={() => runAction('assign-reviewer', () => api.post(`/admin/articles/${article.id}/assign-reviewer`, { reviewer_id: Number(reviewerId) }), 'Reviewer assigned.')}
              >
                Assign Reviewer
              </PanelButton>
            </div>
          </div>
        </section>
      )}

      {isSubEditor && mySubEditorAssignment && mySubEditorAssignment.status !== 'completed' && (
        <section className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Sub Editor Recommendation</h4>
          <select value={subEditorForm.recommendation} onChange={(e) => setSubEditorForm({ ...subEditorForm, recommendation: e.target.value })} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            {recommendationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <textarea value={subEditorForm.comments} onChange={(e) => setSubEditorForm({ ...subEditorForm, comments: e.target.value })} rows={2} placeholder="Comments for author..." className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
          <textarea value={subEditorForm.internal_notes} onChange={(e) => setSubEditorForm({ ...subEditorForm, internal_notes: e.target.value })} rows={2} placeholder="Internal notes for editor..." className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
          <PanelButton loading={busyAction === 'sub-editor-recommendation'} onClick={() => runAction('sub-editor-recommendation', () => api.post(`/admin/sub-editor-assignments/${mySubEditorAssignment.id}/submit-recommendation`, subEditorForm), 'Recommendation submitted.')}>Submit Recommendation</PanelButton>
        </section>
      )}

      {isReviewer && myReviewerAssignment && (
        <section className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Reviewer Scorecard</h4>
          {myReviewerAssignment.status === 'pending' && (
            <PanelButton icon={CheckCircle2} loading={busyAction === 'accept-review'} onClick={() => runAction('accept-review', () => api.post(`/admin/reviewer-assignments/${myReviewerAssignment.id}/accept`), 'Review assignment accepted.')}>Accept Review</PanelButton>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select value={reviewForm.recommendation} onChange={(e) => setReviewForm({ ...reviewForm, recommendation: e.target.value })} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              {recommendationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {['originality', 'methodology', 'citation_accuracy'].map((key) => (
              <input key={key} type="number" min="1" max="5" value={reviewForm[key]} onChange={(e) => setReviewForm({ ...reviewForm, [key]: Number(e.target.value) })} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" placeholder={key.replaceAll('_', ' ')} />
            ))}
          </div>
          <textarea value={reviewForm.comments_for_author} onChange={(e) => setReviewForm({ ...reviewForm, comments_for_author: e.target.value })} rows={2} placeholder="Comments for author..." className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
          <textarea value={reviewForm.confidential_comments} onChange={(e) => setReviewForm({ ...reviewForm, confidential_comments: e.target.value })} rows={2} placeholder="Confidential comments for editor..." className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
          <PanelButton loading={busyAction === 'submit-review'} onClick={() => runAction('submit-review', () => api.post(`/admin/reviewer-assignments/${myReviewerAssignment.id}/submit-review`, {
            recommendation: reviewForm.recommendation,
            comments_for_author: reviewForm.comments_for_author,
            confidential_comments: reviewForm.confidential_comments,
            scorecard: {
              originality: reviewForm.originality,
              methodology: reviewForm.methodology,
              citation_accuracy: reviewForm.citation_accuracy,
            },
          }), 'Review submitted.')}>Submit Review</PanelButton>
        </section>
      )}

      {canFinalDecision && (
        <section className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Final Editorial Decision</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={decisionForm.decision} onChange={(e) => setDecisionForm({ ...decisionForm, decision: e.target.value })} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              {decisionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={decisionForm.decision_source} onChange={(e) => setDecisionForm({ ...decisionForm, decision_source: e.target.value })} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              {decisionSourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <textarea value={decisionForm.comments_for_author} onChange={(e) => setDecisionForm({ ...decisionForm, comments_for_author: e.target.value })} rows={2} placeholder="Comments for author..." className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
          <textarea value={decisionForm.internal_notes} onChange={(e) => setDecisionForm({ ...decisionForm, internal_notes: e.target.value })} rows={2} placeholder="Internal notes..." className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
          <PanelButton icon={FileCheck2} loading={busyAction === 'final-decision'} onClick={() => runAction('final-decision', () => api.post(`/admin/articles/${article.id}/final-decision`, decisionForm), 'Final decision recorded.')}>Record Decision</PanelButton>
        </section>
      )}

      {canAssignProduction && (
        <section className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Production Assignment</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={productionForm.role}
              onChange={(e) => {
                setProductionForm({ ...productionForm, role: e.target.value, user_id: '' });
                loadAssignees(e.target.value);
              }}
              className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
            >
              <option value="copy_editor">Copy Editor</option>
              <option value="proofreader">Proofreader</option>
            </select>
            <select value={productionForm.user_id} onChange={(e) => setProductionForm({ ...productionForm, user_id: e.target.value })} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <option value="">Select assignee</option>
              {(assignees[productionForm.role] || []).map((item) => <option key={item.id} value={item.id}>{item.name} ({item.email})</option>)}
            </select>
            <input type="date" value={productionForm.due_date} onChange={(e) => setProductionForm({ ...productionForm, due_date: e.target.value })} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
          </div>
          <PanelButton icon={UserPlus} loading={busyAction === 'assign-production'} disabled={!productionForm.user_id} onClick={() => runAction('assign-production', () => api.post(`/admin/articles/${article.id}/production-assignments`, {
            user_id: Number(productionForm.user_id),
            role: productionForm.role,
            due_date: productionForm.due_date || null,
          }), 'Production assignment created.')}>Assign Production</PanelButton>
        </section>
      )}

      {canCompleteProduction && (
        <section className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">My Production Task</h4>
          <p className="text-xs text-zinc-500">Current task: {myProductionAssignment.role?.replaceAll('_', ' ')} ({myProductionAssignment.status})</p>
          <PanelButton icon={Check} loading={busyAction === 'complete-production'} onClick={() => runAction('complete-production', () => api.post(`/admin/production-assignments/${myProductionAssignment.id}/complete`), 'Production task completed.')}>Complete Task</PanelButton>
        </section>
      )}

      {canShowPublish && (
        <section className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Publication</h4>
          <p className="text-xs text-zinc-500">{issues.length > 0 ? `${issues.length} issue(s) available for this magazine.` : 'No issue selection is required yet. Publication metadata can be entered in the publish dialog.'}</p>
          <PanelButton icon={FileCheck2} onClick={onOpenPublish}>Publish Article</PanelButton>
        </section>
      )}

      {canPostPublication && (
        <section className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Post-Publication Action</h4>
          <select value={postForm.action_type} onChange={(e) => setPostForm({ ...postForm, action_type: e.target.value })} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            {postPublicationActions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <textarea value={postForm.reason} onChange={(e) => setPostForm({ ...postForm, reason: e.target.value })} rows={2} placeholder="Reason..." className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
          <textarea value={postForm.notice_text} onChange={(e) => setPostForm({ ...postForm, notice_text: e.target.value })} rows={2} placeholder="Public notice text..." className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
          <PanelButton icon={AlertCircle} loading={busyAction === 'post-publication'} disabled={!postForm.reason.trim() || !postForm.notice_text.trim()} onClick={() => runAction('post-publication', () => api.post(`/admin/articles/${article.id}/post-publication-actions`, postForm), 'Post-publication action recorded.')}>Record Action</PanelButton>
        </section>
      )}

      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850">
        <p className="text-[10px] text-zinc-450 leading-relaxed">
          File upload controls for annotated, reviewed, copy-edited, proof, and publication files are hidden until the backend exposes `article_files` upload endpoints.
        </p>
      </div>
    </div>
  );
}
