import { z } from 'zod';
import { emailField, idField, optionalString, passwordField, requiredString } from './zodHelpers';

const strongPasswordField = z.string()
  .min(1, 'Password is required.')
  .min(8, 'Password must be at least 8 characters.')
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/\d/, 'Password must include a number.')
  .regex(/[@$!%*?&]/, 'Password must include a special symbol.');

const sixDigitCode = (label = 'Code') => z.string().trim().regex(/^\d{6}$/, `Enter the 6-digit ${label.toLowerCase()}.`);
const optionalPositiveInteger = (label) => z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.number().int(`${label} must be a whole number.`).positive(`${label} must be greater than zero.`).optional()
);
const optionalPercent = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.number().min(0, 'Similarity score must be at least 0.').max(100, 'Similarity score must not exceed 100.').optional()
);
const monthSchema = z.enum([
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]);
const recommendationSchema = z.enum(['accept', 'minor_revision', 'major_revision', 'reject']);
const finalDecisionSchema = z.enum(['accepted', 'minor_revision', 'major_revision', 'rejected']);
const decisionSourceSchema = z.enum(['editor_personal_review', 'sub_editor_recommendation', 'reviewer_recommendation', 'mixed_editorial_decision']);
const postPublicationActionSchema = z.enum(['correction', 'retraction', 'update', 'archive', 'unpublish']);

const matchingPasswords = (passwordKey = 'password', confirmationKey = 'password_confirmation', message = 'Passwords do not match.') => (data, ctx) => {
  if (data[passwordKey] !== data[confirmationKey]) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [confirmationKey], message });
  }
};

export const loginSchema = z.object({ email: emailField(), password: passwordField });
export const registerSchema = z.object({ name: requiredString('Name'), email: emailField(), password: passwordField, password_confirmation: passwordField });
export const registerStepOneSchema = z.object({
  name: z.string().trim().min(1, 'Full Name or Academic Title is required.').min(2, 'Academic Title must be at least 2 characters.').max(255, 'Name must not exceed 255 characters.'),
  university_name: requiredString('University or Institutional Affiliation'),
  email: emailField('Academic email'),
});
export const registerFinalSchema = z.object({
  password: passwordField,
  passwordConfirmation: passwordField,
}).superRefine(matchingPasswords('password', 'passwordConfirmation'));
export const forgotPasswordSchema = z.object({ email: emailField() });
export const resetPasswordSchema = z.object({ email: emailField(), token: requiredString('Reset token', 500), password: passwordField, password_confirmation: passwordField });
export const resetPasswordFormSchema = z.object({
  email: emailField(),
  token: requiredString('Reset token', 500),
  password: strongPasswordField,
  passwordConfirmation: strongPasswordField,
}).superRefine(matchingPasswords('password', 'passwordConfirmation'));
export const enforcedPasswordResetSchema = z.object({
  password: passwordField,
  password_confirmation: passwordField,
}).superRefine(matchingPasswords());
export const verificationCodeSchema = z.object({ code: sixDigitCode('code') });
export const emailVerificationSchema = z.object({ email: emailField(), code: sixDigitCode('verification code') });
export const twoFactorVerificationSchema = z.object({ email: emailField(), code: sixDigitCode('authentication code') });
export const supportTicketSchema = z.object({ title: requiredString('Title'), issue_type: requiredString('Issue type'), details: requiredString('Details', 10000) });
export const supportTicketReplySchema = z.object({ reply: requiredString('Reply message', 10000) });
export const supportTicketStatusSchema = z.object({ status: z.enum(['submitted', 'in_review', 'waiting_for_user', 'resolved', 'closed']) });
export const contactSchema = z.object({ name: requiredString('Name'), email: emailField(), subject: requiredString('Subject'), message: requiredString('Message', 10000) });
export const newsletterSchema = z.object({ email: emailField() });
export const magazineSchema = z.object({ title: requiredString('Magazine name'), slug: z.string().optional(), description: optionalString('Description', 10000) });
export const issueSchema = z.object({
  magazine_id: idField,
  volume_number: z.coerce.number().int('Volume must be a whole number.').positive('Volume must be greater than zero.'),
  issue_number: z.coerce.number().int('Issue number must be a whole number.').positive('Issue number must be greater than zero.'),
  issue_month: z.union([monthSchema, z.literal('')]).optional(),
  issue_year: z.coerce.number().int('Publication year must be a whole number.').min(1900, 'Publication year must be 1900 or later.').max(new Date().getFullYear() + 5, 'Publication year is too far in the future.'),
  special_title: optionalString('Issue title', 255),
  description: optionalString('Issue description', 10000),
  status: z.enum(['draft', 'published']).optional(),
});
export const issueArticlePublicationSchema = z.object({
  magazine_issue_id: z.union([idField, z.literal(''), z.null()]).optional(),
  published_year: z.coerce.number().int('Publication year must be a whole number.').min(1900, 'Publication year must be 1900 or later.').max(new Date().getFullYear() + 5, 'Publication year is too far in the future.'),
  published_month: monthSchema,
  doi: optionalString('DOI', 255),
  page_start: optionalPositiveInteger('Start page'),
  page_end: optionalPositiveInteger('End page'),
}).superRefine((data, ctx) => {
  if (data.page_start && data.page_end && data.page_end < data.page_start) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['page_end'], message: 'End page must be greater than or equal to start page.' });
  }
});
export const articleBasicsSchema = z.object({ magazine_id: idField, title: requiredString('Title'), abstract: requiredString('Abstract', 100000) });
export const articleDraftSchema = z.object({ magazine_id: z.union([idField, z.literal(''), z.null()]).optional(), title: optionalString('Title', 255), abstract: optionalString('Abstract', 100000), terms_accepted: z.boolean().optional() });
export const articleSubmitSchema = articleBasicsSchema.extend({ terms_accepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms and conditions before submitting.' }) }) });
export const reviewerInvitationSchema = z.object({ token: requiredString('Invitation token', 500) });
export const reviewerInvitationResponseSchema = z.object({
  id: requiredString('Invitation id', 500),
  token: requiredString('Invitation token', 500),
  action: z.enum(['accept', 'decline']),
  decline_reason: optionalString('Decline reason', 1000),
});
export const reviewerSubmitSchema = z.object({ recommendation: requiredString('Recommendation'), comments_for_author: optionalString('Comments', 10000), confidential_comments: optionalString('Confidential comments', 10000) });

export const workflowScreeningSchema = z.object({
  decision: z.enum(['send_to_review', 'reject', 'transfer']),
  plagiarism_status: optionalString('Similarity status', 255),
  plagiarism_score: optionalPercent,
  comments: optionalString('Screening notes', 10000),
}).superRefine((data, ctx) => {
  if (data.decision === 'reject' && !String(data.comments || '').trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['comments'], message: 'Reason for Author is required.' });
  }
});

export const articleTransferRequestSchema = z.object({
  to_magazine_id: idField,
  editor_comments: requiredString('Transfer comments', 5000),
});

export const articleTransferRejectSchema = z.object({
  author_rejection_reason: requiredString('Rejection reason', 5000),
});

export const workflowAssigneeSchema = z.object({ assignee_id: idField });
export const workflowSuggestedReviewerSchema = z.object({ suggested_preference_id: idField });
export const workflowManualReviewerSchema = z.object({
  name: optionalString('Reviewer name'),
  email: emailField('Reviewer email'),
  affiliation: optionalString('Affiliation'),
});
export const subEditorRecommendationSchema = z.object({
  recommendation: recommendationSchema,
  comments: optionalString('Comments for Author', 10000),
  internal_notes: optionalString('Internal notes', 10000),
});

const questionnaireAnswerSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.union([z.string(), z.number(), z.boolean()])),
]);

const hasAnswer = (answer) => {
  if (Array.isArray(answer)) return answer.length > 0;
  return answer !== undefined && answer !== null && String(answer).trim() !== '';
};

export const reviewerWorkflowSubmitSchemaFor = (requiredQuestionIds = []) => z.object({
  recommendation: recommendationSchema,
  comments_for_author: optionalString('Comments for Author', 10000),
  confidential_comments: optionalString('Confidential comments', 10000),
  questionnaire_responses: z.array(z.object({
    question_id: z.coerce.number().int().positive(),
    answer: questionnaireAnswerSchema.optional(),
    comment: optionalString('Question comment', 10000),
  })).optional(),
  scorecard: z.object({
    originality: z.coerce.number().int().min(1).max(5),
    methodology: z.coerce.number().int().min(1).max(5),
    citation_accuracy: z.coerce.number().int().min(1).max(5),
  }),
}).superRefine((data, ctx) => {
  requiredQuestionIds.forEach((questionId) => {
    const response = (data.questionnaire_responses || []).find((item) => Number(item.question_id) === Number(questionId));
    if (!response || !hasAnswer(response.answer)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['questionnaire_responses'], message: 'Answer all required reviewer questionnaire questions.' });
    }
  });
});

export const finalEditorialDecisionSchema = z.object({
  decision: finalDecisionSchema,
  decision_source: decisionSourceSchema,
  comments_for_author: optionalString('Comments for Author', 10000),
  internal_notes: optionalString('Internal notes', 10000),
}).superRefine((data, ctx) => {
  if (data.decision !== 'accepted' && !String(data.comments_for_author || '').trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['comments_for_author'], message: 'Comments for Author are required for revision or rejection decisions.' });
  }
});

export const productionAssignmentSchema = z.object({
  user_id: idField,
  role: z.enum(['copy_editor']),
  due_date: optionalString('Due date', 255),
});
export const productionCompletionSchema = z.object({ assignment_id: idField });
export const postPublicationWorkflowSchema = z.object({
  action_type: postPublicationActionSchema,
  reason: requiredString('Reason', 10000),
  notice_text: requiredString('Public Notice', 10000),
});

export const publishArticleModalSchema = z.object({
  published_year: z.coerce.number().int('Publication year must be a whole number.').min(1900, 'Publication year must be 1900 or later.').max(new Date().getFullYear() + 5, 'Publication year is too far in the future.'),
  published_month: monthSchema,
  magazine_issue_id: z.union([idField, z.literal(''), z.null()]).optional(),
  doi: optionalString('DOI', 255),
  page_start: optionalPositiveInteger('Start page'),
  page_end: optionalPositiveInteger('End page'),
  metadata: z.object({
    article_type: optionalString('Article type'),
    article_category: optionalString('Article category'),
    open_access_label: optionalString('Open access label'),
    academic_editor: optionalString('Academic editor'),
    license_statement: optionalString('Copyright / License', 10000),
    data_availability_statement: optionalString('Data Availability', 10000),
    funding_statement: optionalString('Funding', 10000),
    competing_interests_statement: optionalString('Competing Interests', 10000),
    abbreviations: optionalString('Abbreviations', 10000),
    citation_text: optionalString('Citation Text', 10000),
  }).passthrough(),
  publication_sections: z.array(z.object({
    title: requiredString('Section title'),
    section_key: requiredString('Section key'),
    content_html: optionalString('Section content', 100000),
  }).passthrough()).min(1, 'At least one publication section is required.'),
}).superRefine((data, ctx) => {
  if (data.page_start && data.page_end && data.page_end < data.page_start) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['page_end'], message: 'End page must be greater than or equal to start page.' });
  }
});

export const profileSchema = z.object({
  name: requiredString('Name'),
  university_name: optionalString('University or affiliation'),
});

export const changePasswordSchema = z.object({
  codeVerified: z.literal(true, { errorMap: () => ({ message: 'Verify the emailed code before changing password.' }) }),
  code: sixDigitCode('code'),
  password: passwordField,
  password_confirmation: passwordField,
}).superRefine(matchingPasswords());

export const currentEmailCodeSchema = z.object({ currentEmailCode: sixDigitCode('code from your current email') });
export const newEmailRequestSchema = z.object({
  newEmail: emailField('New email'),
  currentEmail: emailField('Current email'),
}).superRefine((data, ctx) => {
  if (data.newEmail.trim().toLowerCase() === data.currentEmail.trim().toLowerCase()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['newEmail'], message: 'New email must be different from your current email.' });
  }
});
export const newEmailCodeSchema = z.object({ newEmailCode: sixDigitCode('code from your new email') });
export const disableTwoFactorSchema = z.object({ disable2faCode: sixDigitCode('disable code') });

const adminUserBaseSchema = z.object({
  name: requiredString('Name'),
  email: emailField('Email'),
  university_name: optionalString('University or affiliation'),
  role_id: idField,
  status: z.enum(['active', 'pending']).optional(),
  editor_ids: z.array(z.coerce.number().int().positive()).optional(),
  magazine_ids: z.array(z.coerce.number().int().positive()).optional(),
});

export const adminUserSchemaFor = ({ requireStatus = false, requireEditorAssignment = false, requireMagazineAssignment = false } = {}) => (
  adminUserBaseSchema.superRefine((data, ctx) => {
    if (requireStatus && !data.status) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['status'], message: 'Account state is required.' });
    }
    if (requireEditorAssignment && (!data.editor_ids || data.editor_ids.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['editor_ids'], message: 'At least one Editor must be assigned to a Sub Editor.' });
    }
    if (requireMagazineAssignment && (!data.magazine_ids || data.magazine_ids.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['magazine_ids'], message: 'Select at least one magazine for this role.' });
    }
  })
);

export const roleCreateSchema = z.object({
  display_name: requiredString('Display name'),
  name: requiredString('Role identifier'),
  description: optionalString('Purpose', 1000),
});

export const registrationSettingsSchema = z.object({
  registration_enabled: z.boolean(),
  default_role_id: idField,
  registration_notice: optionalString('Registration notice', 500),
});

export const subEditorInviteSchema = z.object({
  name: requiredString('Name'),
  email: emailField('Email'),
});
