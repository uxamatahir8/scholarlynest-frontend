import { z } from 'zod';
import { emailField, idField, optionalString, passwordField, requiredString } from './zodHelpers';

export const loginSchema = z.object({ email: emailField(), password: passwordField });
export const registerSchema = z.object({ name: requiredString('Name'), email: emailField(), password: passwordField, password_confirmation: passwordField });
export const forgotPasswordSchema = z.object({ email: emailField() });
export const resetPasswordSchema = z.object({ email: emailField(), token: requiredString('Reset token', 500), password: passwordField, password_confirmation: passwordField });
export const supportTicketSchema = z.object({ title: requiredString('Title'), issue_type: requiredString('Issue type'), message: requiredString('Details', 10000) });
export const contactSchema = z.object({ name: requiredString('Name'), email: emailField(), subject: requiredString('Subject'), message: requiredString('Message', 10000) });
export const newsletterSchema = z.object({ email: emailField() });
export const magazineSchema = z.object({ title: requiredString('Magazine name'), slug: requiredString('Slug'), description: optionalString('Description', 10000) });
export const issueSchema = z.object({ volume_number: optionalString('Volume'), issue_number: optionalString('Issue'), issue_year: z.coerce.number().int().min(1900).max(2200) });
export const articleBasicsSchema = z.object({ magazine_id: idField, title: requiredString('Title'), abstract: requiredString('Abstract', 100000) });
export const articleDraftSchema = z.object({ magazine_id: z.union([idField, z.literal(''), z.null()]).optional(), title: optionalString('Title', 255), abstract: optionalString('Abstract', 100000), terms_accepted: z.boolean().optional() });
export const articleSubmitSchema = articleBasicsSchema.extend({ terms_accepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms and conditions before submitting.' }) }) });
export const reviewerInvitationSchema = z.object({ token: requiredString('Invitation token', 500) });
export const reviewerSubmitSchema = z.object({ recommendation: requiredString('Recommendation'), comments_for_author: optionalString('Comments', 10000), confidential_comments: optionalString('Confidential comments', 10000) });
