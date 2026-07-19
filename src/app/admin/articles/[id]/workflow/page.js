'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  FileText, 
  CheckSquare, 
  Gavel, 
  Users, 
  UserCheck, 
  Layers, 
  Clock, 
  ShieldAlert, 
  FileImage, 
  Files, 
  Sheet,
  FileCheck2,
  CheckCircle2
} from 'lucide-react';
import api, { buildApiUrl } from '../../../../../utils/api';
import { safeApiMessage } from '../../../../../utils/safeErrors';
import { logError } from '../../../../../utils/safeLogger';
import { useAuth } from '../../../../../context/AuthContext';
import { useToast } from '../../../../../context/ToastContext';
import LoadingState from '../../../../../components/ui/LoadingState';
import PageTitle from '../../../../../components/PageTitle';
import ErrorState from '../../../../../components/ui/ErrorState';
import Alert from '../../../../../components/ui/Alert';
import EmptyState from '../../../../../components/ui/EmptyState';
import ImageLightboxGallery from '../../../../../components/ui/ImageLightboxGallery';
import CurrentWorkflowActionPanel from '../../../../../components/admin/CurrentWorkflowActionPanel';
import { PUBLISHABLE_STATUSES } from '../../../../../components/admin/articleWorkflow';
import ManuscriptHeader from '../../../../../components/admin/workflow/ManuscriptHeader';
import ArticleMetadataPanel from '../../../../../components/admin/workflow/ArticleMetadataPanel';
import AssignmentSummary from '../../../../../components/admin/workflow/AssignmentSummary';
import { 
  DownloadRow, 
  supplementaryGroup, 
  galleryImage, 
  assetTitle, 
  assetMeta 
} from '../../../../../components/admin/workflow/ArticleFilesPanel';
import WorkflowTimeline from '../../../../../components/admin/workflow/WorkflowTimeline';
import WorkflowProgressPath from '../../../../../components/admin/workflow/WorkflowProgressPath';
import { 
  canViewReviewerIdentity, 
  isAuthorViewer, 
  formatDate, 
  labelize, 
  fileTypeLabels,
  submissionVersionLabel,
  hasAcceptedReviewInvitation,
} from '../../../../../components/admin/workflow/workflowDisplay';
import { normalizeStatus } from '../../../../../utils/status';

// Helper component for Editorial Decision Tab
function EditorialDecisionTab({ article }) {
  const decisions = article?.editorial_decisions || [];

  if (decisions.length === 0) {
    return (
      <EmptyState title="No decisions recorded">
        No editorial decisions have been recorded for this manuscript yet.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      {decisions.map((decision) => (
        <div key={decision.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3 mb-4">
            <div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                ['accepted', 'approved'].includes(decision.decision)
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : ['rejected'].includes(decision.decision)
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
              }`}>
                {labelize(decision.decision)}
              </span>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Source: {labelize(decision.decision_source)}
              </p>
            </div>
            <div className="text-right text-xs text-[var(--muted)]">
              <p className="font-semibold text-[var(--foreground)]">Decided by: {decision.decider?.name || 'Editorial Team'}</p>
              <p className="mt-0.5">{formatDate(decision.decision_date)}</p>
            </div>
          </div>
          {decision.comments_for_author && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Comments for Author</h4>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)] break-words">{decision.comments_for_author}</p>
            </div>
          )}
          {decision.internal_notes && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] bg-[var(--surface-muted)] -mx-6 -mb-6 p-6 rounded-b-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">Internal Editorial Notes</h4>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)] break-words">{decision.internal_notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AdditionalManuscriptFilesTab({ files, versions }) {
  const versionById = new Map((versions || []).map((version) => [Number(version.id), version]));
  const groups = [...(versions || [])]
    .sort((a, b) => Number(b.version_number || 0) - Number(a.version_number || 0))
    .map((version) => ({
      version,
      files: files.filter((file) => Number(file.article_version_id) === Number(version.id)),
    }))
    .filter((group) => group.files.length > 0);
  const pending = files.filter((file) => !file.article_version_id || !versionById.has(Number(file.article_version_id)));
  if (pending.length) groups.unshift({ version: null, files: pending });

  if (groups.length === 0) {
    return <EmptyState title="No additional manuscript files">No additional manuscript files have been uploaded.</EmptyState>;
  }

  return (
    <div className="space-y-5">
      {groups.map(({ version, files: groupFiles }) => (
        <section key={version?.id || 'current'} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="text-sm font-bold text-[var(--foreground)]">
            {!version ? 'Current Submission' : submissionVersionLabel(version)}
          </h3>
          <ul className="mt-3 grid gap-3">
            {groupFiles.map((file) => (
              <DownloadRow
                key={file.id}
                item={file}
                title={file.file_title || file.original_name || 'Additional manuscript file'}
                meta={`${file.original_name} · ${file.mime_type || 'Document'} · ${file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Size unavailable'} · ${file.uploader?.name || 'Unknown uploader'} · ${formatDate(file.created_at)} · ${file.scan_status || 'clean'}`}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// Helper component for Reviewer Recommendation Tab
function ReviewerRecommendationTabContent({ assignment, article }) {
  const reviewerFiles = (article?.files || []).filter((file) => (
    file.file_type === 'reviewed_manuscript'
    && file.assignment_type === 'reviewer_assignment'
    && Number(file.assignment_id) === Number(assignment.id)
  ));

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--foreground)]">Reviewer Recommendation</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Status: <span className="font-semibold">{labelize(assignment.status || assignment.invitation_state)}</span>
          </p>
        </div>
        {assignment.recommendation && (
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
            {labelize(assignment.recommendation)}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {assignment.comments_for_author && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Comments for Author</h4>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)] break-words">{assignment.comments_for_author}</p>
          </div>
        )}

        {assignment.confidential_comments && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-1">Confidential Comments for Editor</h4>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)] break-words">{assignment.confidential_comments}</p>
          </div>
        )}

        {reviewerFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Reviewer Uploaded Files</h4>
            <ul className="grid gap-2">
              {reviewerFiles.map((file) => (
                <DownloadRow
                  key={file.id}
                  item={file}
                  title={file.original_name || 'Reviewed manuscript'}
                  meta="Reviewed manuscript"
                />
              ))}
            </ul>
          </div>
        )}

        {assignment.questionnaire_instance?.questions?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Evaluation Questionnaire</h4>
            <dl className="space-y-3">
              {assignment.questionnaire_instance.questions.map((question) => (
                <div key={question.id} className="min-w-0">
                  <dt className="text-xs font-bold text-[var(--foreground)]">{question.prompt}</dt>
                  <dd className="mt-1 text-sm text-[var(--muted)]">
                    {(() => {
                      const answers = Array.isArray(question.answer) ? question.answer : [question.answer];
                      return answers.filter(Boolean).map((answer) => question.options?.find((option) => option.value === answer)?.label || labelize(answer)).join(', ') || 'No response';
                    })()}
                  </dd>
                  {question.comment && (
                    <dd className="mt-1.5 whitespace-pre-wrap rounded-md border-l-2 border-amber-500 bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--foreground)]">
                      {question.comment}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for Sub Editor Recommendation Tab
function SubEditorRecommendationTabContent({ assignment, article }) {
  const subEditorFiles = (article?.files || []).filter((file) => (
    file.file_type === 'annotated_manuscript'
    && file.assignment_type === 'sub_editor_assignment'
    && Number(file.assignment_id) === Number(assignment.id)
  ));

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--foreground)]">Sub Editor Recommendation</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Assigned: {formatDate(assignment.created_at)}
          </p>
        </div>
        {assignment.recommendation && (
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {labelize(assignment.recommendation)}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {assignment.comments && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Recommendation Comments</h4>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)] break-words">{assignment.comments}</p>
          </div>
        )}

        {assignment.internal_notes && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1">Internal Notes</h4>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)] break-words">{assignment.internal_notes}</p>
          </div>
        )}

        {subEditorFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Annotated Manuscript</h4>
            <ul className="grid gap-2">
              {subEditorFiles.map((file) => (
                <DownloadRow
                  key={file.id}
                  item={file}
                  title={file.original_name || 'Annotated manuscript'}
                  meta="Annotated manuscript"
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for Submission Version Tab
function uniqueRecordsById(items) {
  const seen = new Set();
  return items.filter((item) => {
    const id = Number(item?.id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function VersionTabContent({ version, article, isLatest, user, hasRole, unassignedLegacyAlert }) {
  const sections = version.sections || [];

  // Flatten and group all files of this version
  const allFiles = [];
  sections.forEach((section) => {
    if (section.files && section.files.length > 0) {
      allFiles.push(...section.files);
    }
  });

  const mainFiles = [];
  const additionalFiles = [];
  const imageFiles = [];
  const supplementaryFiles = [];

  allFiles.forEach((file) => {
    const mime = String(file.mime_type || '').toLowerCase();
    const ext = String(file.original_name || file.file_title || '').split('.').pop()?.toLowerCase() || '';
    const isImg = file.file_type === 'image' || mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tif', 'tiff'].includes(ext);

    if (isImg) {
      imageFiles.push(file);
    } else if (file.file_type === 'manuscript') {
      mainFiles.push(file);
    } else if (file.file_type === 'additional_manuscript_file' || file.file_type === 'revision_response') {
      additionalFiles.push(file);
    } else {
      supplementaryFiles.push(file);
    }
  });

  const hasAnyFiles = allFiles.length > 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-[var(--foreground)]">
            {submissionVersionLabel(version)} {article.tracking_code && `(${article.tracking_code})`}
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Submitted at {formatDate(version.created_at)} {version.user?.name && `by ${version.user.name}`}
          </p>
        </div>
        {isLatest && (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
            Latest Submission
          </span>
        )}
      </div>

      {isLatest && unassignedLegacyAlert && (
        <div className="mb-6">
          {unassignedLegacyAlert}
        </div>
      )}

      {version.change_summary && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1">Change Summary / Revision Notes</h4>
          <p className="text-sm leading-relaxed text-[var(--foreground)] whitespace-pre-line">{version.change_summary}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* 1. Manuscript Info */}
        <div className="border-b border-[var(--border)] pb-6 last:border-0 last:pb-0">
          <ArticleMetadataPanel article={article} user={user} hasRole={hasRole} />
        </div>

        {/* 2. Main File */}
        {mainFiles.length > 0 && (
          <div className="border-b border-[var(--border)] pb-6 last:border-0 last:pb-0">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Main File</h4>
            <ul className="grid gap-2">
              {mainFiles.map((file) => (
                <DownloadRow
                  key={file.id}
                  item={file}
                  title={file.original_name || fileTypeLabels[file.file_type] || 'Main File'}
                  meta={`Primary Manuscript · ${formatDate(file.created_at)}`}
                />
              ))}
            </ul>
          </div>
        )}

        {/* 3. Additional files */}
        {additionalFiles.length > 0 && (
          <div className="border-b border-[var(--border)] pb-6 last:border-0 last:pb-0">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Additional files</h4>
            <ul className="grid gap-2">
              {additionalFiles.map((file) => (
                <DownloadRow
                  key={file.id}
                  item={file}
                  title={file.original_name || file.file_title || fileTypeLabels[file.file_type] || 'Additional File'}
                  meta={`${file.file_type === 'revision_response' ? 'Response to Reviewers' : 'Additional Submission File'} · ${formatDate(file.created_at)}`}
                />
              ))}
            </ul>
          </div>
        )}

        {/* 4. Images */}
        {imageFiles.length > 0 && (
          <div className="border-b border-[var(--border)] pb-6 last:border-0 last:pb-0">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Images</h4>
            <div className="mb-3">
              <ImageLightboxGallery
                images={imageFiles.map((file) => {
                  const srcUrl = file.display_url || buildApiUrl(file.download_endpoint || file.download_url);
                  return {
                    src: srcUrl,
                    title: file.original_name,
                    caption: file.file_title || file.original_name,
                    label: file.metadata?.label || file.metadata?.figure_number || null,
                    alt: file.original_name,
                  };
                })}
                title="Images"
                showHeader={false}
                objectFit="contain"
              />
            </div>
          </div>
        )}

        {/* 5. Supplementary files */}
        {supplementaryFiles.length > 0 && (
          <div className="border-b border-[var(--border)] pb-6 last:border-0 last:pb-0">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Supplementary files</h4>
            <ul className="grid gap-2">
              {supplementaryFiles.map((file) => (
                <DownloadRow
                  key={file.id}
                  item={file}
                  title={file.original_name || file.file_title || fileTypeLabels[file.file_type] || 'Supplementary File'}
                  meta={`Supplementary Material · ${formatDate(file.created_at)}`}
                />
              ))}
            </ul>
          </div>
        )}

        {!hasAnyFiles && (
          <EmptyState title="No files">No files are visible for this version.</EmptyState>
        )}
      </div>
    </div>
  );
}

function AcceptedFilesTab({ acceptedFileSet, compact = false }) {
  if (!acceptedFileSet) {
    return <EmptyState title="No accepted file set">Accepted source files will appear after the editorial acceptance decision.</EmptyState>;
  }

  const versionLabel = submissionVersionLabel(acceptedFileSet.version);
  const items = acceptedFileSet.items || [];
  const manuscriptItems = items.filter((item) => item.accepted_role === 'manuscript');
  const additionalItems = items.filter((item) => item.accepted_role === 'additional');
  const supplementaryItems = items
    .filter((item) => item.accepted_role === 'supplementary')
    .map((item) => ({ kind: 'file', item: item.file, acceptedItem: item }));
  const groupedSupplementary = supplementaryItems.reduce((groups, entry) => {
    groups[supplementaryGroup(entry.kind, entry.item)].push(entry);
    return groups;
  }, { images: [], sheets: [], files: [] });
  const supplementaryGroups = [
    { id: 'images', title: 'Images', icon: FileImage, items: groupedSupplementary.images },
    { id: 'sheets', title: 'Sheets and Data', icon: Sheet, items: groupedSupplementary.sheets },
    { id: 'files', title: 'Supplementary Files', icon: Files, items: groupedSupplementary.files },
  ].filter((group) => group.items.length > 0);
  const acceptedMeta = (acceptedItem, role) => {
    const file = acceptedItem.file;
    return `${fileTypeLabels[file.file_type] || labelize(role)} · ${submissionVersionLabel(acceptedItem.source_version)} · Uploaded ${formatDate(file.created_at)} · Accepted`;
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <h3 className="text-base font-bold text-[var(--foreground)]">{versionLabel}</h3>
          <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
            Accepted {formatDate(acceptedFileSet.accepted_at)} by {acceptedFileSet.accepted_by?.name || 'Editorial Team'}
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          Accepted Version
        </span>
      </div>

      <div className="space-y-4">
        {!compact && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              Only clean author files uploaded for {versionLabel} are included. Earlier submission files remain in version history only.
            </p>
          </div>
        )}

        {manuscriptItems.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Manuscript Files</h4>
            <ul className="grid gap-2">
              {manuscriptItems.map((acceptedItem) => (
                <DownloadRow
                  key={acceptedItem.id}
                  item={acceptedItem.file}
                  title={acceptedItem.file.file_title || acceptedItem.file.original_name || 'Manuscript'}
                  meta={acceptedMeta(acceptedItem, 'manuscript')}
                />
              ))}
            </ul>
          </div>
        )}

        {additionalItems.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Files className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Additional Manuscript Files</h4>
            </div>
            <ul className="grid gap-2">
              {additionalItems.map((acceptedItem) => (
                <DownloadRow
                  key={acceptedItem.id}
                  item={acceptedItem.file}
                  title={acceptedItem.file.file_title || acceptedItem.file.original_name || 'Additional file'}
                  meta={acceptedMeta(acceptedItem, 'additional')}
                />
              ))}
            </ul>
          </div>
        )}

        {supplementaryGroups.map((group) => (
          <div key={group.id}>
            <div className="mb-2 flex items-center gap-2">
              <group.icon className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{group.title}</h4>
            </div>
            {group.id === 'images' ? (
              <ImageLightboxGallery images={group.items.map(galleryImage)} title="Images" showHeader={false} />
            ) : (
              <ul className="grid gap-2">
                {group.items.map(({ acceptedItem }) => (
                  <DownloadRow
                    key={acceptedItem.id}
                    item={acceptedItem.file}
                    title={assetTitle(acceptedItem.file)}
                    meta={acceptedMeta(acceptedItem, 'supplementary')}
                  />
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper component for Copyediting Tab
function CopyeditingTab({ article, user, hasRole }) {
  const assignments = (article?.production_assignments || []).filter(
    (assignment) => assignment.role === 'copy_editor'
  );

  const copyEditedFiles = (article?.files || []).filter(
    (file) => file.file_type === 'copy_edited_file'
  );

  const hasContent = assignments.length > 0 || copyEditedFiles.length > 0;

  if (!hasContent) {
    return (
      <EmptyState title="No copyediting records">
        No copyediting assignments or files have been created for this manuscript yet.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      {assignments.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Copyediting Assignments</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {assignments.map((assignment) => {
              const filesForAssignment = copyEditedFiles.filter(
                (file) => file.assignment_type === 'production_assignment' && Number(file.assignment_id) === Number(assignment.id)
              );

              return (
                <div key={assignment.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--foreground)]">{assignment.user?.name || 'Assigned Copy Editor'}</h3>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Status: <span className="font-semibold">{labelize(assignment.status)}</span>
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      assignment.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    }`}>
                      {labelize(assignment.status)}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs text-[var(--muted)]">
                    {assignment.due_date && (
                      <p>
                        <span className="font-semibold text-[var(--foreground)]">Due Date:</span> {formatDate(assignment.due_date)}
                      </p>
                    )}
                    {assignment.completed_at && (
                      <p>
                        <span className="font-semibold text-[var(--foreground)]">Completed At:</span> {formatDate(assignment.completed_at)}
                      </p>
                    )}
                  </div>

                  {filesForAssignment.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Uploaded Files</h4>
                      <ul className="grid gap-2">
                        {filesForAssignment.map((file) => (
                          <DownloadRow
                            key={file.id}
                            item={file}
                            title={file.original_name || 'Copyedited Manuscript'}
                            meta={`Uploaded ${formatDate(file.created_at)}`}
                          />
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Uploaded files that are not linked to a specific assignment */}
      {(() => {
        const unlinkedFiles = copyEditedFiles.filter(
          (file) => file.assignment_type !== 'production_assignment' || !assignments.some(a => Number(a.id) === Number(file.assignment_id))
        );

        if (unlinkedFiles.length === 0) return null;

        return (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Other Copyedited Files</h4>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <ul className="grid gap-2">
                {unlinkedFiles.map((file) => (
                  <DownloadRow
                    key={file.id}
                    item={file}
                    title={file.original_name || 'Copyedited Manuscript'}
                    meta={`Uploaded ${formatDate(file.created_at)}`}
                  />
                ))}
              </ul>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Helper component for Final Files Tab
const resolveFinalFileSection = (file, article) => {
  const sectionKey = file.metadata?.section_key || file.metadata?.document_type || file.metadata?.purpose;
  if (sectionKey && [
    'published_pdf', 'public_images', 'figures', 'tables', 
    'supplementary_downloads', 'research_data', 'graphical_abstract', 
    'cover_image', 'supporting_documents', 'other_public_files'
  ].includes(sectionKey)) {
    return sectionKey;
  }

  if (file.file_type === 'publication_pdf') {
    return 'published_pdf';
  }

  const purposeLower = String(sectionKey || file.file_type || '').toLowerCase();

  if (purposeLower.includes('graphical_abstract') || purposeLower.includes('graphicalabstract')) {
    return 'graphical_abstract';
  }
  if (purposeLower.includes('cover_image') || purposeLower.includes('coverimage')) {
    return 'cover_image';
  }
  if (purposeLower.includes('supporting_document') || purposeLower.includes('supporting')) {
    return 'supporting_documents';
  }

  const mime = String(file.mime_type || '').toLowerCase();
  const ext = String(file.original_name || file.file_title || '').split('.').pop()?.toLowerCase() || '';
  const isImage = mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);

  if (isImage) {
    return 'public_images';
  }

  if (purposeLower.includes('figure')) {
    return 'figures';
  }
  if (purposeLower.includes('table')) {
    return 'tables';
  }
  if (purposeLower.includes('research_data') || purposeLower.includes('data')) {
    return 'research_data';
  }
  if (file.file_type === 'supplementary') {
    return 'supplementary_downloads';
  }

  return 'other_public_files';
};

const getPublicationState = (file, article) => {
  const isClean = file.scan_status === 'clean';
  if (!isClean) {
    return 'Excluded from frontend (unclean)';
  }

  const showOnArticle = file.publication_visibility?.show_on_article;
  const showInDownloads = file.publication_visibility?.show_in_downloads;
  const isActivePdf = file.file_type === 'publication_pdf' && file.original_name === article['pdf_' + 'path'];

  const isConfigured = showOnArticle || showInDownloads || isActivePdf || file.file_type === 'supplementary';

  if (!isConfigured) {
    return 'Excluded from frontend';
  }
  if (article.status === 'published') {
    return 'Published on frontend';
  }

  return 'Prepared but not published';
};

function FinalFilesTab({ article }) {
  const [downloadingId, setDownloadingId] = useState(null);
  const allFiles = article.files || [];
  
  const sectionsConfig = {
    published_pdf: { title: 'Published Article PDF', order: 1 },
    public_images: { title: 'Public Article Images', order: 2 },
    figures: { title: 'Figures', order: 3 },
    tables: { title: 'Tables', order: 4 },
    supplementary_downloads: { title: 'Supplementary Downloads', order: 5 },
    research_data: { title: 'Research Data', order: 6 },
    graphical_abstract: { title: 'Graphical Abstract', order: 7 },
    cover_image: { title: 'Cover Image', order: 8 },
    supporting_documents: { title: 'Supporting Documents', order: 9 },
    other_public_files: { title: 'Other Public Files', order: 10 },
  };

  const downloadFileSecurely = async (file) => {
    const rawEndpoint = file.download_endpoint || file.download_url;
    if (!rawEndpoint || downloadingId) return;
    
    setDownloadingId(file.id);
    
    try {
      const endpoint = buildApiUrl(rawEndpoint);
      const isPdf = file.mime_type === 'application/pdf' || (file.original_name || '').toLowerCase().endsWith('.pdf');
      const params = { json: 1 };
      if (isPdf) {
        params.preview = 1;
      }
      
      const response = await api.get(endpoint, { params });
      
      if (!response.data || !response.data.download_url) {
        throw new Error('No download URL returned');
      }
      
      const anchor = document.createElement('a');
      anchor.href = response.data.download_url;
      anchor.rel = 'noopener';
      if (isPdf) {
        anchor.target = '_blank';
      } else {
        anchor.download = response.data.filename || file.original_name || 'download';
      }
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (err) {
      logError(err);
      const msg = err?.response?.data?.message || 'Unable to download this file. Please try again.';
      alert(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  const grouped = {};
  Object.keys(sectionsConfig).forEach((key) => {
    grouped[key] = [];
  });

  allFiles.forEach((file) => {
    if (file.scan_status !== 'clean') return;
    
    if (!['copy_edited_file', 'proof_file', 'publication_pdf', 'supplementary', 'additional_manuscript_file'].includes(file.file_type)) {
      return;
    }

    const secKey = resolveFinalFileSection(file, article);
    grouped[secKey].push(file);
  });

  const activeSections = Object.entries(sectionsConfig)
    .map(([key, config]) => ({
      key,
      title: config.title,
      order: config.order,
      files: grouped[key] || [],
    }))
    .filter((sec) => sec.files.length > 0)
    .sort((a, b) => a.order - b.order);

  if (activeSections.length === 0) {
    return (
      <EmptyState title="No final files">
        No finalized copy-edited, proof, or publication files have been prepared for this manuscript yet.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      {activeSections.map((section) => (
        <div key={section.key} className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{section.title}</h4>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    <th className="pb-3 pr-4">File Details</th>
                    <th className="pb-3 px-4">Size</th>
                    <th className="pb-3 px-4">Uploaded</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 pl-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {section.files.map((file) => {
                    const pubState = getPublicationState(file, article);
                    const stateBadgeClass = pubState === 'Published on frontend'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : pubState === 'Prepared but not published'
                      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                      : 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400';

                    return (
                      <tr key={file.id} className="text-xs text-[var(--foreground)] hover:bg-[var(--surface-muted)]/50 transition-colors">
                        <td className="py-3 pr-4 font-semibold max-w-xs truncate">
                          <span className="block truncate text-sm" title={file.original_name}>
                            {file.original_name}
                          </span>
                          <span className="block text-[10px] text-[var(--muted)] font-normal">
                            Type: {fileTypeLabels[file.file_type] || labelize(file.file_type)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--muted)] whitespace-nowrap">
                          {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-[var(--muted)] whitespace-nowrap">
                          {formatDate(file.created_at)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${stateBadgeClass}`}>
                            {pubState}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-right whitespace-nowrap font-medium">
                          {(() => {
                            const isPdf = file.mime_type === 'application/pdf' || (file.original_name || '').toLowerCase().endsWith('.pdf');
                            const buttonLabel = isPdf ? 'Preview' : 'Download';
                            const loadingLabel = isPdf ? 'Previewing…' : 'Downloading…';
                            return (
                              <button
                                type="button"
                                onClick={() => downloadFileSecurely(file)}
                                disabled={downloadingId !== null}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)] hover:bg-[var(--surface-muted)] border border-[var(--border)] transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {downloadingId === file.id ? loadingLabel : buttonLabel}
                              </button>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Actions checker
function hasWorkflowActions(article, user, hasRole) {
  const isAdmin = hasRole('super_admin') || hasRole('admin');
  const isEditor = hasRole('editor');
  const isSubEditor = hasRole('sub_editor');
  const isPublisher = hasRole('publisher');

  const canEditorial = isAdmin || isEditor;
  const canAssignReviewer = isAdmin || isEditor || isSubEditor;
  const canPublish = isAdmin || isPublisher;
  const canAssignProduction = isAdmin || isPublisher;

  const status = normalizeStatus(article.status);

  if (
    status === 'in_transit'
    && article.can_respond_transfer_request
    && article.pending_transfer_request?.status === 'pending'
  ) return true;
  
  if (canEditorial && (status === 'submitted' || status === 'resubmitted')) return true;
  if (isAdmin) return true;
  if (canEditorial && status === 'screening') return true;
  if (canAssignReviewer && ['under_review', 'assigned_to_sub_editor', 'reviewer_assigned', 'review_in_progress'].includes(status)) return true;

  const myReviewerAssignment = (article.reviewer_assignments || []).find((item) => Number(item.reviewer_id) === Number(user.id));
  if (myReviewerAssignment && (myReviewerAssignment.invitation_state === 'invited' || myReviewerAssignment.status === 'accepted' || myReviewerAssignment.status === 'in_progress')) return true;

  const mySubEditorAssignment = (article.sub_editor_assignments || []).find((item) => Number(item.sub_editor_id) === Number(user.id));
  if (mySubEditorAssignment && mySubEditorAssignment.status !== 'completed') return true;

  if (canEditorial && ['under_review', 'review_in_progress', 'assigned_to_sub_editor'].includes(status)) return true;

  if (article.can_author_final_review) return true;

  if (canAssignProduction && status === 'accepted') return true;

  const myProductionAssignment = (article.production_assignments || []).find((item) => Number(item.user_id) === Number(user.id) && item.status !== 'completed');
  if (myProductionAssignment) return true;

  if (canPublish && ['ready_for_publication', 'copy_editing', 'proofreading'].includes(status)) return true;

  if (canPublish && status === 'published') return true;

  return false;
}

export default function ArticleWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = params?.id;
  const { user, hasRole, hasPermission, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('metadata');
  const observerReadonly = searchParams.get('observer_readonly') === '1';

  const loadWorkflow = async () => {
    if (!articleId || authLoading || !user) return;
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/admin/articles/${articleId}/workflow`);
      const nextArticle = response.data?.article ? {
        ...response.data.article,
        files: response.data.files || response.data.article.files || [],
        versions: response.data.versions || response.data.article.versions || [],
      } : null;
      setArticle(nextArticle);
    } catch (err) {
      logError(err);
      setError(safeApiMessage(err, 'Unable to load this manuscript workflow.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflow();
  }, [articleId, user, authLoading]);

  const canPublish = useMemo(() => (
    Boolean(article)
      && (hasRole('super_admin') || hasRole('admin') || hasRole('publisher'))
      && PUBLISHABLE_STATUSES.has(article.status)
  ), [article, hasRole]);

  const showReviewerIdentity = useMemo(() => canViewReviewerIdentity(user, hasRole), [user, hasRole]);

  const tabs = useMemo(() => {
    if (!article) return [];

    const list = [];
    const isAuthor = isAuthorViewer(user, article);
    const hasHistoryAccess = article.capabilities?.view_workflow_history;

    const legacyFiles = article.unassigned_legacy_files || [];
    const unassignedLegacyAlert = hasHistoryAccess && legacyFiles.length > 0 ? (
      <div className="mb-6">
        <Alert tone="warning" title="Unassigned Legacy Files Found">
          <div className="space-y-2">
            <p className="text-xs">
              The following files are associated with this article but have no active version linkage. Please verify their contents:
            </p>
            <ul className="grid gap-2 mt-2">
              {legacyFiles.map((file) => (
                <DownloadRow
                  key={file.id}
                  item={file}
                  title={file.original_name || 'Legacy File'}
                  meta={`${fileTypeLabels[file.file_type] || labelize(file.file_type)} · Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`}
                />
              ))}
            </ul>
          </div>
        </Alert>
      </div>
    ) : null;

    const canViewReviewWorkflow = hasRole('super_admin') || hasRole('admin') || hasRole('editor') || hasRole('sub_editor');
    const isReviewer = hasRole('reviewer');
    const orderedVersions = [...(article.versions || [])].sort((a, b) => Number(a.version_number || 0) - Number(b.version_number || 0));
    
    const visibleVersions = orderedVersions.filter((version) => {
      if (isReviewer && !canViewReviewWorkflow) {
        return (version.files || []).length > 0 || (version.sections || []).some(s => s.files && s.files.length > 0);
      }
      return true;
    });

    if (!hasRole('copy_editor')) {
      visibleVersions.forEach((version, index) => {
        const isLatest = version.id === (orderedVersions[orderedVersions.length - 1]?.id);

        list.push({
          id: `version-${version.id}`,
          label: article.tracking_code ? `${submissionVersionLabel(version)} (${article.tracking_code})` : submissionVersionLabel(version),
          icon: Layers,
          content: (
            <VersionTabContent
              version={version}
              article={article}
              isLatest={isLatest}
              user={user}
              hasRole={hasRole}
              unassignedLegacyAlert={unassignedLegacyAlert}
            />
          ),
        });
      });
    }

    const showEditorialDecisionTab = article.capabilities?.view_editorial_decision;
    if (showEditorialDecisionTab) {
      list.push({
        id: 'editorial',
        label: 'Editorial Decision',
        icon: Gavel,
        content: (
          <EditorialDecisionTab article={article} />
        ),
      });
    }

    const subEditorAssignments = article.sub_editor_assignments || [];
    subEditorAssignments.forEach((assignment, index) => {
      const isCompleted = assignment.status === 'completed';
      const subEditorName = assignment.sub_editor?.name || `Sub Editor ${index + 1}`;
      const label = `Sub Editor — ${subEditorName}${isCompleted ? '' : ' (Pending)'}`;
      
      list.push({
        id: `subeditor-${assignment.id}`,
        label: label,
        icon: UserCheck,
        content: (
          <SubEditorRecommendationTabContent assignment={assignment} article={article} />
        ),
      });
    });

    const reviewerAssignments = article.reviewer_assignments || [];
    reviewerAssignments.forEach((assignment, index) => {
      const isCompleted = assignment.status === 'completed';
      const reviewerBaseName = showReviewerIdentity
        ? (assignment.invitee_name || assignment.reviewer?.name || `Reviewer ${index + 1}`)
        : `Reviewer ${index + 1}`;
      
      const label = `Reviewer — ${reviewerBaseName}${isCompleted ? '' : ' (Pending)'}`;

      list.push({
        id: `reviewer-${assignment.id}`,
        label: label,
        icon: Users,
        content: (
          <ReviewerRecommendationTabContent 
            assignment={assignment} 
            article={article}
            canSeeReviewerIdentity={showReviewerIdentity}
          />
        ),
      });
    });

    const showCopyeditingTab = article.capabilities?.view_copy_editing;
    if (showCopyeditingTab) {
      list.push({
        id: 'copyediting',
        label: 'Copy Editing',
        icon: FileCheck2,
        content: (
          <CopyeditingTab article={article} user={user} hasRole={hasRole} />
        ),
      });
    }

    const showFinalFilesTab = article.capabilities?.view_final_files && article.status === 'published';
    if (showFinalFilesTab) {
      list.push({
        id: 'finalfiles',
        label: 'Final Files',
        icon: CheckCircle2,
        content: (
          <FinalFilesTab article={article} />
        ),
      });
    }

    if (hasHistoryAccess && article.audit_logs && article.audit_logs.length > 0) {
      list.push({
        id: 'history',
        label: 'Workflow History',
        icon: Clock,
        content: (
          <WorkflowTimeline article={article} />
        ),
      });
    }

    return list;
  }, [article, user, hasRole, observerReadonly, showReviewerIdentity, loadWorkflow, toast]);

  // Handle activeTab adjustment when tabs list changes
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  if (authLoading || loading) {
    return <LoadingState label="Loading manuscript workflow..." className="min-h-[420px]" />;
  }

  if (error || !article) {
    return <ErrorState title="Workflow unavailable">{error || 'The manuscript workflow could not be loaded.'}</ErrorState>;
  }

  return (
    <main className="space-y-6">
      <PageTitle title={`Workflow - ${article.title}`} />
      <ManuscriptHeader
        article={article}
        user={user}
        hasRole={hasRole}
        canPublish={canPublish && !observerReadonly}
        onPublish={() => router.push(`/admin/articles/${article.id}/publish`)}
      />

      <WorkflowProgressPath article={article} />

      {observerReadonly ? (
        <Alert tone="info" title="Super Admin Review Mode">
          This manuscript record was opened from an observer queue. Workflow actions are disabled in this view.
        </Alert>
      ) : (
        <CurrentWorkflowActionPanel
          article={article}
          workflowContext={article}
          user={user}
          hasRole={hasRole}
          hasPermission={hasPermission}
          onWorkflowChanged={loadWorkflow}
          onOpenPublish={() => router.push(`/admin/articles/${article.id}/publish`)}
          toast={toast}
        />
      )}

      <div className="border-b border-[var(--border)]">
        <nav className="flex space-x-6 overflow-x-auto pb-2 tab-scroller" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--muted)] hover:border-[var(--muted-border)] hover:text-[var(--foreground)]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>

    </main>
  );
}
