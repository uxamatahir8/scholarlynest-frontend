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
import api from '../../../../../utils/api';
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
import WorkflowActionPanel from '../../../../../components/admin/WorkflowActionPanel';
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
function VersionTabContent({ version, article, generalFiles, assets, fallbackVersionId, fileForAsset, isLatest }) {
  const versionFiles = generalFiles.filter((file) => Number(file.article_version_id || fallbackVersionId) === Number(version.id));
  const versionAssets = assets.filter((asset) => {
    const sourceFile = fileForAsset.get(Number(asset.id));
    return Number(sourceFile?.article_version_id || fallbackVersionId) === Number(version.id);
  });
  const assetIds = new Set(versionAssets.map((asset) => Number(asset.id)));
  const primaryFiles = versionFiles.filter((file) => !['supplementary', 'additional_manuscript_file'].includes(file.file_type));
  
  const supplementaryItems = [
    ...versionFiles
      .filter((file) => file.file_type === 'supplementary' && !assetIds.has(Number(file.source_asset_id)))
      .map((file) => ({ kind: 'file', item: file })),
    ...versionAssets.map((asset) => ({ kind: 'asset', item: asset })),
  ];
  
  const grouped = supplementaryItems.reduce((groups, entry) => {
    groups[supplementaryGroup(entry.kind, entry.item)].push(entry);
    return groups;
  }, { images: [], sheets: [], files: [] });

  const supplementaryGroups = [
    { id: 'images', title: 'Images', icon: FileImage, items: grouped.images },
    { id: 'sheets', title: 'Sheets and Data', icon: Sheet, items: grouped.sheets },
    { id: 'files', title: 'Supplementary Files', icon: Files, items: grouped.files },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--foreground)]">
            {submissionVersionLabel(version)}
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

      {version.change_summary && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1">Change Summary / Revision Notes</h4>
          <p className="text-sm leading-relaxed text-[var(--foreground)] whitespace-pre-line">{version.change_summary}</p>
        </div>
      )}

      <div className="space-y-4">
        {primaryFiles.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Manuscript and Response Files</h4>
            <ul className="grid gap-2">
              {primaryFiles.map((file) => (
                <DownloadRow 
                  key={file.id} 
                  item={file} 
                  title={file.original_name || fileTypeLabels[file.file_type] || 'File'} 
                  meta={`${fileTypeLabels[file.file_type] || labelize(file.file_type)} · ${formatDate(file.created_at)}`} 
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
                {group.items.map(({ kind, item }) => (
                  <DownloadRow key={`${kind}-${item.id}`} item={item} title={assetTitle(item)} meta={assetMeta(kind, item)} />
                ))}
              </ul>
            )}
          </div>
        ))}
        
        {primaryFiles.length === 0 && supplementaryGroups.length === 0 && (
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
function FinalFilesTab({ article }) {
  const finalFiles = (article?.files || []).filter(
    (file) => file.file_type === 'proof_file' || file.file_type === 'publication_pdf'
  );

  const proofFiles = finalFiles.filter((file) => file.file_type === 'proof_file');
  const pubFiles = finalFiles.filter((file) => file.file_type === 'publication_pdf');

  if (finalFiles.length === 0) {
    return (
      <EmptyState title="No final files">
        No final proofs or published PDFs have been uploaded for this manuscript yet.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      {proofFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Proof Files</h4>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <ul className="grid gap-2">
              {proofFiles.map((file) => (
                <DownloadRow
                  key={file.id}
                  item={file}
                  title={file.original_name || 'Proof File'}
                  meta={`Uploaded ${formatDate(file.created_at)}`}
                />
              ))}
            </ul>
          </div>
        </div>
      )}

      {pubFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Published PDFs</h4>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <ul className="grid gap-2">
              {pubFiles.map((file) => (
                <DownloadRow
                  key={file.id}
                  item={file}
                  title={file.original_name || 'Published PDF'}
                  meta={`Uploaded ${formatDate(file.created_at)}`}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Actions checker
function hasWorkflowActions(article, user, hasRole) {
  if (!article || !user) return false;
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

    // 1. Manuscript Information
    list.push({
      id: 'metadata',
      label: 'Manuscript Information',
      icon: FileText,
      content: (
        <ArticleMetadataPanel article={article} user={user} hasRole={hasRole} />
      ),
    });

    // 2. Actions & Assignments
    const hasActions = hasWorkflowActions(article, user, hasRole);
    list.push({
      id: 'actions',
      label: 'Actions & Assignments',
      icon: CheckSquare,
      content: (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="space-y-6">
            {observerReadonly ? (
              <Alert tone="info" title="Super Admin Review Mode">
                This manuscript record was opened from an observer queue. Workflow actions are disabled in this view.
              </Alert>
            ) : hasActions ? (
              <WorkflowActionPanel
                article={article}
                workflowContext={article}
                user={user}
                hasRole={hasRole}
                hasPermission={hasPermission}
                onWorkflowChanged={loadWorkflow}
                onOpenPublish={() => router.push(`/admin/articles/${article.id}/publish`)}
                toast={toast}
              />
            ) : (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
                <ShieldAlert className="mx-auto h-8 w-8 text-[var(--muted)]" />
                <h4 className="mt-2 text-sm font-bold text-[var(--foreground)]">No Actions Available</h4>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  No workflow actions are currently available for your role at this stage.
                </p>
              </div>
            )}
          </div>
          <aside className="space-y-6">
            <AssignmentSummary article={article} canSeeReviewerIdentity={showReviewerIdentity} />
          </aside>
        </div>
      ),
    });

    // 3. Editorial Decision
    const decisions = article.editorial_decisions || [];
    const isAuthor = isAuthorViewer(user, article);
    const hasEditorialAccess = hasRole('super_admin') || hasRole('admin') || hasRole('editor') || hasRole('publisher') || hasRole('sub_editor');
    const showEditorialDecisionTab = hasEditorialAccess || (isAuthor && decisions.length > 0);

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

    // 4. Reviewer Recommendations
    const canViewReviewWorkflow = hasRole('super_admin') || hasRole('admin') || hasRole('editor') || hasRole('sub_editor');
    const isReviewer = hasRole('reviewer');

    const reviewerAssignments = (article.reviewer_assignments || []).filter((assignment) => {
      if (!hasAcceptedReviewInvitation(assignment)) return false;
      if (isReviewer && !canViewReviewWorkflow) {
        return Number(assignment.reviewer_id) === Number(user.id);
      }
      if (isAuthor) {
        return assignment.status === 'completed';
      }
      return true;
    });

    reviewerAssignments.forEach((assignment, index) => {
      const isCompleted = assignment.status === 'completed';
      const reviewerName = showReviewerIdentity
        ? (assignment.invitee_name || assignment.reviewer?.name || `Reviewer ${index + 1}`)
        : `Reviewer ${index + 1}`;
      
      const label = `${reviewerName}'s Recommendation${isCompleted ? '' : ' (Pending)'}`;

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

    // 5. Sub-Editor Recommendations
    const showSubEditorTabs = hasRole('super_admin') || hasRole('admin') || hasRole('editor') || hasRole('sub_editor');
    if (showSubEditorTabs) {
      const subEditorAssignments = article.sub_editor_assignments || [];

      subEditorAssignments.forEach((assignment) => {
        list.push({
          id: `subeditor-${assignment.id}`,
          label: `${assignment.sub_editor?.name || 'Sub Editor'}'s Recommendation`,
          icon: UserCheck,
          content: (
            <SubEditorRecommendationTabContent assignment={assignment} article={article} />
          ),
        });
      });
    }

    // 5.5 Copyediting Tab
    if (article.accepted_file_set) {
      list.push({
        id: 'accepted-files',
        label: 'Accepted Files',
        icon: FileCheck2,
        content: <AcceptedFilesTab acceptedFileSet={article.accepted_file_set} />,
      });
    }

    const copyEditedFiles = (article.files || []).filter((file) => file.file_type === 'copy_edited_file');
    const copyEditorAssignments = (article.production_assignments || []).filter((assignment) => assignment.role === 'copy_editor');
    const showCopyeditingTab = hasRole('super_admin') || hasRole('admin') || hasRole('editor') || hasRole('publisher') || hasRole('copy_editor') || hasRole('sub_editor') || copyEditedFiles.length > 0 || copyEditorAssignments.length > 0;

    if (showCopyeditingTab) {
      list.push({
        id: 'copyediting',
        label: 'Copyediting',
        icon: FileCheck2,
        content: (
          <CopyeditingTab article={article} user={user} hasRole={hasRole} />
        ),
      });
    }

    // 5.6 Final Files Tab
    const finalFiles = (article.files || []).filter((file) => file.file_type === 'proof_file' || file.file_type === 'publication_pdf');
    const showFinalFilesTab = hasRole('super_admin') || hasRole('admin') || hasRole('editor') || hasRole('publisher') || hasRole('proofreader') || isAuthor || finalFiles.length > 0;

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

    const additionalManuscriptFiles = (article.files || []).filter((file) => file.file_type === 'additional_manuscript_file' && file.scan_status === 'clean' && file.article_version_id);
    if (!hasRole('copy_editor') && (isAuthor || hasEditorialAccess)) {
      list.push({
        id: 'additional-manuscript-files',
        label: 'Additional Manuscript Files',
        icon: Files,
        content: <AdditionalManuscriptFilesTab files={additionalManuscriptFiles} versions={article.versions || []} />,
      });
    }

    // 6. Submission/Revision Versions
    const orderedVersions = [...(article.versions || [])].sort((a, b) => Number(b.version_number || 0) - Number(a.version_number || 0));
    const fallbackVersionId = orderedVersions.at(-1)?.id;
    const generalFiles = (article.files || []).filter(
      (file) => file.file_type !== 'reviewed_manuscript'
      && file.file_type !== 'copy_edited_file'
      && file.file_type !== 'proof_file'
      && file.file_type !== 'publication_pdf'
      && file.file_type !== 'additional_manuscript_file'
    );
    const fileForAsset = new Map(generalFiles
      .filter((file) => file.source_asset_id)
      .map((file) => [Number(file.source_asset_id), file]));

    const visibleVersions = orderedVersions.filter((version) => {
      if (isReviewer && !canViewReviewWorkflow) {
        const versionFiles = generalFiles.filter((file) => Number(file.article_version_id || fallbackVersionId) === Number(version.id));
        return versionFiles.length > 0;
      }
      return true;
    });

    if (!hasRole('copy_editor')) visibleVersions.forEach((version, index) => {
      const versionLabel = `${article.tracking_code} - ${submissionVersionLabel(version)}`;

      list.push({
        id: `version-${version.id}`,
        label: versionLabel,
        icon: Layers,
        content: (
          <VersionTabContent
            version={version}
            article={article}
            generalFiles={generalFiles}
            assets={article.assets || []}
            fallbackVersionId={fallbackVersionId}
            fileForAsset={fileForAsset}
            isLatest={index === 0}
          />
        ),
      });
    });

    // 7. Workflow History
    const hasHistoryAccess = hasRole('super_admin') || hasRole('admin') || hasRole('editor') || hasRole('publisher');
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
