import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { acceptedManuscriptView, firstVisibleSidebarKey, initialWorkspaceTab, REVIEWER_WORKSPACE_SECTIONS, reviewerCardAction, reviewerInvitationScope, scopeArticleToVersion, versionNeedsEditorialScreening, visibleWorkspaceTabs, withVersionReviewerData, workspaceVersionForTab } from '../src/components/admin/workflow/workspaceManifest.mjs';

test('workspace renders backend tab order and hides inaccessible metadata', () => {
  const tabs = visibleWorkspaceTabs({ tabs: [
    { key: 'version-1', label: 'Initial Submission (ART-2026-001)', type: 'article_version' },
    { key: 'version-2', version_id: 2, revision_number: 1, label: 'ART-2026-001 – R1 (Accepted)', heading: 'R1 (ART-2026-001)', type: 'article_version' },
    { key: 'hidden', label: 'Hidden', visible: false },
    { key: 'final-editorial-decision', label: 'Final Editorial Decision' },
    { key: 'communication', label: 'Communication' },
  ] });
  assert.deepEqual(tabs.map((tab) => tab.key), ['version-1', 'version-2', 'final-editorial-decision', 'communication']);
  assert.equal(initialWorkspaceTab(tabs), 'version-1');
  assert.equal(initialWorkspaceTab(tabs, true), 'communication');
});

test('initial, R1, and R2 remain distinct authoritative version tabs', () => {
  const tabs = visibleWorkspaceTabs({ tabs: [
    { key: 'version-40', version_id: 40, revision_number: 0, label: 'Initial Submission (SN-2026-000004)', heading: 'Initial Submission (SN-2026-000004)', type: 'article_version' },
    { key: 'version-42', version_id: 42, revision_number: 1, label: 'SN-2026-000004 – R1', heading: 'R1 (SN-2026-000004)', type: 'article_version' },
    { key: 'version-47', version_id: 47, revision_number: 2, label: 'SN-2026-000004 – R2 (Accepted)', heading: 'R2 (SN-2026-000004)', type: 'article_version', is_accepted: true },
  ] });

  assert.deepEqual(tabs.map(({ key, version_id, label, heading }) => ({ key, version_id, label, heading })), [
    { key: 'version-40', version_id: 40, label: 'Initial Submission (SN-2026-000004)', heading: 'Initial Submission (SN-2026-000004)' },
    { key: 'version-42', version_id: 42, label: 'SN-2026-000004 – R1', heading: 'R1 (SN-2026-000004)' },
    { key: 'version-47', version_id: 47, label: 'SN-2026-000004 – R2 (Accepted)', heading: 'R2 (SN-2026-000004)' },
  ]);
  assert.equal(tabs.filter((tab) => tab.label.endsWith('(Accepted)')).length, 1);
});

test('selected article version never merges workflow records from another version', () => {
  const scoped = scopeArticleToVersion({
    title: 'Current title',
    files: [{ id: 1, article_version_id: 10 }, { id: 2, article_version_id: 11 }],
    editorial_decisions: [{ id: 3, article_version_id: 10 }, { id: 4, article_version_id: 11 }],
    sub_editor_assignments: [{ id: 5, article_version_id: 11 }],
    reviewer_assignments: [{ id: 6, article_version_id: 10 }, { id: 7, article_version_id: 11 }],
    production_assignments: [],
  }, { id: 10, metadata_snapshot: { title: 'Immutable title' }, submitted_at: '2026-01-01T00:00:00Z' }, {
    key: 'version-10',
    status: { code: 'submitted', label: 'Submitted' },
    submitted_at: '2026-01-01T00:00:00Z',
    is_accepted: false,
  });
  assert.equal(scoped.title, 'Immutable title');
  assert.equal(scoped.status, 'submitted');
  assert.equal(scoped.author_status, 'Submitted');
  assert.equal(scoped.is_accepted_version, false);
  assert.deepEqual(scoped.files.map((item) => item.id), [1]);
  assert.deepEqual(scoped.editorial_decisions.map((item) => item.id), [3]);
  assert.deepEqual(scoped.sub_editor_assignments, []);
  assert.deepEqual(scoped.reviewer_assignments.map((item) => item.id), [6]);
});

test('R1 and R2 tabs resolve content by their exact persisted version IDs', () => {
  const versions = [
    { id: 91, revision_number: 2, change_summary: 'R2 data' },
    { id: 44, revision_number: 1, change_summary: 'R1 data' },
  ];
  const r1 = workspaceVersionForTab(versions, { key: 'version-44', version_id: 44, heading: 'R1 (SN-2026-000004)' });
  const r2 = workspaceVersionForTab(versions, { key: 'version-91', version_id: 91, heading: 'R2 (SN-2026-000004)' });

  assert.equal(r1.id, 44);
  assert.equal(r1.change_summary, 'R1 data');
  assert.equal(r1.workspace_heading, 'R1 (SN-2026-000004)');
  assert.equal(r2.id, 91);
  assert.equal(r2.change_summary, 'R2 data');
  assert.equal(r2.workspace_heading, 'R2 (SN-2026-000004)');
});

test('frontend revision display utility does not derive a revision from version position', () => {
  const source = readFileSync(new URL('../src/components/admin/workflow/workflowDisplay.js', import.meta.url), 'utf8');
  assert.equal(source.includes('versionNumber - 1'), false);
  assert.equal(source.includes('index + 1'), false);
  assert.equal(source.includes('index + 2'), false);
});

test('reviewers panel receives the exact manifest-selected version', () => {
  const source = readFileSync(new URL('../src/app/admin/articles/[id]/workflow/page.js', import.meta.url), 'utf8');
  assert.match(source, /<ReviewersPanel article=\{scopedArticle\} version=\{selectedVersion\} versionTab=\{tab\}/);
  assert.doesNotMatch(source, /<ReviewersPanel article=\{scopedArticle\} version=\{version\}/);
});

test('only the accepted revision receives accepted version state', () => {
  const article = { status: 'accepted', files: [], editorial_decisions: [], sub_editor_assignments: [], reviewer_assignments: [], production_assignments: [] };
  const initial = scopeArticleToVersion(article, { id: 1, status_snapshot: 'submitted' }, { status: { code: 'submitted', label: 'Submitted' }, is_accepted: false });
  const revision = scopeArticleToVersion(article, { id: 2, status_snapshot: 'under_review' }, { status: { code: 'accepted', label: 'Accepted' }, is_accepted: true });
  assert.equal(initial.status, 'submitted');
  assert.equal(initial.is_accepted_version, false);
  assert.equal(revision.status, 'accepted');
  assert.equal(revision.is_accepted_version, true);
});

test('editorial screening is offered once for the pending initial submission only', () => {
  const base = { current_version_id: 1, files: [], editorial_decisions: [], sub_editor_assignments: [], reviewer_assignments: [], production_assignments: [] };
  const pendingInitial = scopeArticleToVersion(base, { id: 1, revision_number: 0, parent_version_id: null, screening_status: 'pending' }, {
    is_current: true,
    status: { code: 'submitted', label: 'Submitted', screening: 'pending' },
  });
  const screenedInitial = scopeArticleToVersion(base, { id: 1, revision_number: 0, parent_version_id: null, screening_status: 'passed' }, {
    is_current: true,
    status: { code: 'submitted', label: 'Submitted', screening: 'passed' },
  });
  const revision = scopeArticleToVersion({ ...base, current_version_id: 2 }, { id: 2, revision_number: 1, parent_version_id: 1, screening_status: 'pending' }, {
    is_current: true,
    status: { code: 'submitted', label: 'Submitted', screening: 'pending' },
  });

  assert.equal(versionNeedsEditorialScreening(pendingInitial), true);
  assert.equal(versionNeedsEditorialScreening(screenedInitial), false);
  assert.equal(versionNeedsEditorialScreening(revision), false);
});

test('switching either direction selects the first visible sidebar item', () => {
  const initial = { key: 'version-1', sidebar: [{ key: 'hidden', visible: false }, { key: 'manuscript-information', visible: true }, { key: 'reviewers' }] };
  const revision = { key: 'version-2', sidebar: [{ key: 'manuscript-information', visible: true }, { key: 'reviewers' }] };
  assert.equal(firstVisibleSidebarKey(revision), 'manuscript-information');
  assert.equal(firstVisibleSidebarKey(initial), 'manuscript-information');
});

test('reviewer workspace always has three sections and clears prior version data', () => {
  assert.deepEqual(REVIEWER_WORKSPACE_SECTIONS, ['Suggested Reviewers', 'Opposed Reviewers', 'Manual Invitation']);
  const prior = withVersionReviewerData({}, { reviewer_assignments: [{ id: 9 }], reviewer_preferences: { suggested: [{ id: 8 }], opposed: [] } });
  const next = withVersionReviewerData(prior, null);
  assert.deepEqual(next.reviewer_assignments, []);
  assert.deepEqual(next.reviewer_preferences, { suggested: [], opposed: [] });
});

test('reviewer card actions use only the selected revision assignment state', () => {
  const capabilities = { resend: true, reinvite: true, reminder: true };
  assert.equal(reviewerCardAction({ previously_completed_review: false }, capabilities), 'invite');
  assert.equal(reviewerCardAction({ previously_completed_review: true }, capabilities), 'invite_revision');
  assert.equal(reviewerCardAction({ existingAssignment: { invitation_state: 'invited' } }, capabilities), 'resend');
  assert.equal(reviewerCardAction({ existingAssignment: { invitation_state: 'declined' } }, capabilities), 'reinvite');
  assert.equal(reviewerCardAction({ existingAssignment: { invitation_state: 'expired' } }, capabilities), 'reinvite');
  assert.equal(reviewerCardAction({ existingAssignment: { invitation_state: 'accepted' } }, capabilities), 'reminder');
  assert.equal(reviewerCardAction({ existingAssignment: { invitation_state: 'in_progress' } }, capabilities), 'reminder');
  assert.equal(reviewerCardAction({ existingAssignment: { invitation_state: 'completed' } }, capabilities), 'completed');
});

test('reviewer invitations include the selected version and open review round', () => {
  const payload = reviewerInvitationScope({
    versions: [{ id: 81 }],
    reviewer_round: { review_round_id: 17, round_number: 1 },
  }, { email: 'reviewer@example.test' });

  assert.equal(payload.article_version_id, 81);
  assert.equal(payload.review_round_id, 17);
  assert.equal(payload.round_number, 1);
  assert.equal(payload.email, 'reviewer@example.test');
  assert.ok(payload.idempotency_key);
});

test('disabled manual invitation retains the backend reason and opposed reviewers stay separate', () => {
  const article = withVersionReviewerData({}, {
    reviewer_preferences: { suggested: [], opposed: [{ id: 9, email: 'blocked@example.test' }] },
    reviewers: { status: 'closed', disabled_reason: { code: 'REVIEW_ROUND_NOT_OPEN', message: 'Open a review round before inviting reviewers.' } },
    disabled_reason: { code: 'REVIEW_ROUND_NOT_OPEN', message: 'Open a review round before inviting reviewers.' },
    capabilities: { manage: false, manual_invitation: false },
  });
  assert.equal(article.reviewer_disabled_reason.code, 'REVIEW_ROUND_NOT_OPEN');
  assert.deepEqual(article.reviewer_preferences.suggested, []);
  assert.equal(article.reviewer_preferences.opposed[0].email, 'blocked@example.test');
});

test('reviewer portal renders assignment-scoped invitation and review actions', () => {
  const source = readFileSync(new URL('../src/components/admin/reviewer/ReviewerDeskList.js', import.meta.url), 'utf8');
  assert.match(source, /Pending Invitations/);
  assert.match(source, /Pending and Active Reviews/);
  assert.match(source, /Completed Reviews/);
  assert.match(source, /Closed, Declined, or Expired History/);
  assert.match(source, />Accept Invitation</);
  assert.match(source, />Decline Invitation</);
  assert.match(source, /Decline Invitation[\s\S]*Reason \(optional\)/);
  assert.match(source, /assignment\.version_label/);
  assert.match(source, /assignment=\$\{assignment\.id\}/);
  assert.match(source, /assignment\.capabilities\?\.start_review/);
  assert.match(source, /assignment\.capabilities\?\.continue_review/);
  assert.match(source, /reviewer-assignments\/\$\{assignment\.id\}\/start/);
  assert.match(source, />Start Review</);
});

test('reviewer home dashboard routes pending invitations to the response controls', () => {
  const utils = readFileSync(new URL('../src/components/admin/dashboard/dashboardUtils.js', import.meta.url), 'utf8');
  const dashboard = readFileSync(new URL('../src/components/admin/dashboard/AssignmentDashboardWorkspace.js', import.meta.url), 'utf8');

  assert.match(utils, /assignment\.primary_action === 'accept_decline'/);
  assert.match(utils, /href = '\/admin\/reviewer\?status=pending'/);
  assert.match(dashboard, /priority=\{isReviewerDashboard\}/);
});

test('completed reviewer cards open the exact version review comments', () => {
  const actions = readFileSync(new URL('../src/components/admin/WorkflowActionPanel.js', import.meta.url), 'utf8');
  const workspace = readFileSync(new URL('../src/app/admin/articles/[id]/workflow/page.js', import.meta.url), 'utf8');

  assert.match(actions, /assignment\?\.status === 'completed'/);
  assert.match(actions, /workflow\?version=\$\{assignment\.article_version_id\}&assignment=\$\{assignment\.id\}/);
  assert.match(actions, />\s*Open Comments\s*</);
  assert.match(workspace, /setActiveSection\(requestedSection \|\| firstVisibleSidebarKey\(tab\)\)/);
});

test('reviewer dashboard identifies and opens the exact assigned revision', () => {
  const dashboardUtils = readFileSync(new URL('../src/components/admin/dashboard/dashboardUtils.js', import.meta.url), 'utf8');
  const reviewerDesk = readFileSync(new URL('../src/components/admin/reviewer/ReviewerDeskList.js', import.meta.url), 'utf8');

  assert.match(dashboardUtils, /`\$\{baseTrackingCode\} – \$\{assignment\.version_label\}`/);
  assert.match(dashboardUtils, /workflow\?version=\$\{assignment\.article_version_id\}&assignment=\$\{assignment\.id\}/);
  assert.match(reviewerDesk, /trackingCode=\{\[article\.tracking_code, assignment\.version_label\]/);
});

test('pending-review decision conflict uses an accessible policy modal and stable idempotency key', () => {
  const source = readFileSync(new URL('../src/components/admin/WorkflowActionPanel.js', import.meta.url), 'utf8');
  assert.match(source, /PENDING_REVIEWS_REQUIRE_CONFIRMATION/);
  assert.match(source, /title="Pending reviewer submissions"/);
  assert.match(source, /Proceed and Keep Pending Reviews Open/);
  assert.match(source, /Proceed and Close Pending Reviews/);
  assert.match(source, /Reason for proceeding without pending reviews/);
  assert.match(source, /Idempotency-Key': decisionIdempotencyKey/);
  assert.match(source, /await onWorkflowChanged\(\)/);
});

test('reviewer workspace deep links to the exact assignment version and shows the late-review notice', () => {
  const page = readFileSync(new URL('../src/app/admin/articles/[id]/workflow/page.js', import.meta.url), 'utf8');
  const panel = readFileSync(new URL('../src/components/admin/WorkflowActionPanel.js', import.meta.url), 'utf8');
  assert.match(page, /searchParams\.get\('version'\)/);
  assert.match(page, /requestedAssignmentId=\{searchParams\.get\('assignment'\)\}/);
  assert.match(page, /actionScope="reviewer-review"/);
  assert.match(panel, /You may still submit this review for the editorial record/);
  assert.match(panel, /save-review-draft/);
  assert.match(panel, />\s*Save Draft\s*</);
});

test('copy editor workspace starts with dedicated accepted manuscript information and has no revision tabs', () => {
  const tabs = visibleWorkspaceTabs({ tabs: [
    { key: 'copyeditor-manuscript', type: 'accepted_manuscript', label: 'Manuscript Information' },
    { key: 'copy-editing', type: 'copy_editing', label: 'Copy Editing' },
    { key: 'workflow-history', type: 'workflow_history', label: 'Workflow History' },
    { key: 'communication', type: 'communication', label: 'Communication' },
  ] });

  assert.equal(initialWorkspaceTab(tabs), 'copyeditor-manuscript');
  assert.deepEqual(tabs.map((tab) => tab.label), ['Manuscript Information', 'Copy Editing', 'Workflow History', 'Communication']);
  assert.equal(tabs.some((tab) => tab.type === 'article_version'), false);
});

test('accepted manuscript view exposes accepted metadata and production files', () => {
  const view = acceptedManuscriptView({
    article: { title: 'Accepted title', abstract: 'Accepted abstract' },
    accepted_version: { id: 12, identifier: 'SN-2026-001-R2' },
    metadata: { article_type: 'Research Article' },
    authors: [{ name: 'Author One' }],
    files: {
      manuscript: [{ id: 1, file: { original_name: 'accepted.docx' } }],
      supplementary: [{ id: 2, file: { original_name: 'dataset.csv' } }],
      accepted_file_set: { id: 4 },
    },
  });

  assert.equal(view.article.title, 'Accepted title');
  assert.equal(view.article.abstract, 'Accepted abstract');
  assert.equal(view.acceptedVersion.id, 12);
  assert.equal(view.manuscriptFiles[0].file.original_name, 'accepted.docx');
  assert.equal(view.supplementaryFiles[0].file.original_name, 'dataset.csv');
  assert.equal(view.acceptedFileSet.id, 4);
});
