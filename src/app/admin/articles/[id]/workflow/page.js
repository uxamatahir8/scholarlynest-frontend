'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { FileImage, Files, Sheet } from 'lucide-react';
import api, { buildApiUrl } from '../../../../../utils/api';
import { safeApiMessage } from '../../../../../utils/safeErrors';
import { logError } from '../../../../../utils/safeLogger';
import { useAuth } from '../../../../../context/AuthContext';
import { useToast } from '../../../../../context/ToastContext';
import LoadingState from '../../../../../components/ui/LoadingState';
import PageTitle from '../../../../../components/PageTitle';
import ErrorState from '../../../../../components/ui/ErrorState';
import EmptyState from '../../../../../components/ui/EmptyState';
import StatusBadge from '../../../../../components/ui/StatusBadge';
import ImageLightboxGallery from '../../../../../components/ui/ImageLightboxGallery';
import ScopedWorkflowActionPanel from '../../../../../components/admin/ScopedWorkflowActionPanel';
import ManuscriptHeader from '../../../../../components/admin/workflow/ManuscriptHeader';
import ArticleMetadataPanel from '../../../../../components/admin/workflow/ArticleMetadataPanel';
import { 
  DownloadRow, 
  supplementaryGroup, 
  galleryImage, 
  assetTitle
} from '../../../../../components/admin/workflow/ArticleFilesPanel';
import WorkflowTimeline from '../../../../../components/admin/workflow/WorkflowTimeline';
import WorkflowProgressPath from '../../../../../components/admin/workflow/WorkflowProgressPath';
import { ProofRoundsPanel } from '../../../../../components/admin/workflow/LifecycleRecordPanels';
import { 
  formatDate, 
  labelize, 
  fileTypeLabels,
  submissionVersionLabel,
} from '../../../../../components/admin/workflow/workflowDisplay';
import ArticleThreadWorkspace from '../../../../../components/admin/threads/ArticleThreadWorkspace';
import { firstVisibleSidebarKey, initialWorkspaceTab, scopeArticleToVersion, visibleWorkspaceTabs, workspaceVersionForTab } from '../../../../../components/admin/workflow/workspaceManifest.mjs';
import ReviewersPanel from '../../../../../components/admin/workflow/ReviewersPanel';
import AcceptedManuscriptInformationPanel from '../../../../../components/admin/workflow/AcceptedManuscriptInformationPanel';

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
            {version.workspace_heading}
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Submitted at {formatDate(version.submitted_at || version.created_at)} {version.user?.name && `by ${version.user.name}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={article.status} />
          {isLatest && <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">Latest Submission</span>}
        </div>
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
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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

function VersionWorkspace({ tab, article, user, hasRole, hasPermission, observerReadonly, onChanged, toast }) {
  const [activeSection, setActiveSection] = useState(() => firstVisibleSidebarKey(tab));
  const selectedVersion = workspaceVersionForTab(article.versions, tab);
  if (!selectedVersion) return <EmptyState title="Version unavailable">This version is not accessible to your role.</EmptyState>;
  const scopedArticle = scopeArticleToVersion(article, selectedVersion, tab);
  const selectedReviewId = activeSection.startsWith('review-') ? Number(activeSection.replace('review-', '')) : null;
  const selectedReview = scopedArticle.reviewer_assignments.find((item) => Number(item.id) === selectedReviewId);
  const actionProps = {
    article: scopedArticle,
    workflowContext: scopedArticle,
    user,
    hasRole,
    hasPermission,
    onWorkflowChanged: onChanged,
    toast,
    hideIfNoAction: true,
  };

  useEffect(() => {
    setActiveSection(firstVisibleSidebarKey(tab));
  }, [tab.key]);

  const content = (() => {
    if (activeSection === 'manuscript-information') {
      return <VersionTabContent version={selectedVersion} article={scopedArticle} isLatest={Number(article.current_version_id) === Number(selectedVersion.id)} user={user} hasRole={hasRole} />;
    }
    if (activeSection === 'editorial-decision') {
      return <div className="space-y-5">{!observerReadonly && <ScopedWorkflowActionPanel {...actionProps} actionScope="editorial-decision" />}<EditorialDecisionTab article={scopedArticle} /></div>;
    }
    if (activeSection === 'sub-editor-recommendation') {
      return <div className="space-y-5">
        {!observerReadonly && <ScopedWorkflowActionPanel {...actionProps} actionScope="sub-editor-recommendation" />}
        {scopedArticle.sub_editor_assignments.length ? scopedArticle.sub_editor_assignments.map((assignment) => <SubEditorRecommendationTabContent key={assignment.id} assignment={assignment} article={scopedArticle} />) : <EmptyState title="No sub-editor assigned">Assignment status will appear here when an editor assigns this version.</EmptyState>}
      </div>;
    }
    if (activeSection === 'reviewers') {
      return <ReviewersPanel article={scopedArticle} version={selectedVersion} versionTab={tab} user={user} hasRole={hasRole} hasPermission={hasPermission} observerReadonly={observerReadonly} onWorkflowChanged={onChanged} toast={toast} />;
    }
    if (selectedReview) return <ReviewerRecommendationTabContent assignment={selectedReview} article={scopedArticle} />;
    return <EmptyState title="Section unavailable">This version section is not available.</EmptyState>;
  })();

  return (
    <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
      <nav className="flex gap-2 overflow-x-auto lg:block" aria-label={`${tab.label} sections`}>
        {(tab.sidebar || []).map((item) => (
          <button key={item.key} type="button" onClick={() => setActiveSection(item.key)} aria-current={activeSection === item.key ? 'page' : undefined}
            className={`shrink-0 whitespace-nowrap rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition-colors lg:mb-1 lg:w-full ${activeSection === item.key ? 'border-[var(--accent)] bg-amber-500/10 text-[var(--accent)]' : 'border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)]'}`}>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="min-w-0">{content}</div>
    </div>
  );
}

export default function ArticleWorkflowPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const articleId = params?.id;
  const { user, hasRole, hasPermission, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('thread') ? 'communication' : null);
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
        workflow_manifest: response.data.workflow_manifest || null,
        status_projection: response.data.status_projection || response.data.article.status_projection || null,
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

  const tabs = visibleWorkspaceTabs(article?.workflow_manifest);

  // Handle activeTab adjustment when tabs list changes
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(initialWorkspaceTab(tabs, Boolean(searchParams.get('thread'))));
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
      <ManuscriptHeader article={article} />

      <WorkflowProgressPath article={article} />

      <nav className="flex gap-2 overflow-x-auto border-b border-[var(--border)] pb-2" aria-label="Article workspace tabs">
          {tabs.map((tab) => {
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-current={activeTab === tab.key ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === tab.key
                    ? 'border-[var(--accent)] bg-amber-500/10 text-[var(--accent)]'
                    : 'border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.key === 'communication' && tab.unread_count > 0 && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">{tab.unread_count}</span>}
              </button>
            );
          })}
      </nav>

      <section className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6" aria-live="polite">
        {(() => {
          const tab = tabs.find((item) => item.key === activeTab);
          if (!tab) return null;
          const commonActions = { article, workflowContext: article, user, hasRole, hasPermission, onWorkflowChanged: loadWorkflow, toast, hideIfNoAction: true };
          if (tab.type === 'accepted_manuscript') return <AcceptedManuscriptInformationPanel articleId={article.id} />;
          if (tab.type === 'article_version') return <VersionWorkspace key={tab.key} tab={tab} article={article} user={user} hasRole={hasRole} hasPermission={hasPermission} observerReadonly={observerReadonly} onChanged={loadWorkflow} toast={toast} />;
          if (tab.type === 'final_editorial_decision') return <div className="space-y-5">{!observerReadonly && <ScopedWorkflowActionPanel {...commonActions} actionScope="final-editorial-decision" />}<EditorialDecisionTab article={article} /></div>;
          if (tab.type === 'copy_editing') return <div className="space-y-5">{!article.accepted_file_set ? <EmptyState title="Copy editing unavailable">Copy editing becomes available after editorial acceptance.</EmptyState> : <><ScopedWorkflowActionPanel {...commonActions} actionScope="copy-editing" /><AcceptedFilesTab acceptedFileSet={article.accepted_file_set} compact /><CopyeditingTab article={article} user={user} hasRole={hasRole} /></>}</div>;
          if (tab.type === 'proofreading') return <div className="space-y-5"><ScopedWorkflowActionPanel {...commonActions} actionScope="proofreading" /><ProofRoundsPanel article={article} /></div>;
          if (tab.type === 'workflow_history') return <WorkflowTimeline article={article} />;
          if (tab.type === 'communication') return <ArticleThreadWorkspace articleId={article.id} availableFiles={article.files || []} initialThreadId={searchParams.get('thread')} />;
          return <EmptyState title="Workspace unavailable">This workspace section is not available.</EmptyState>;
        })()}
      </section>

    </main>
  );
}
