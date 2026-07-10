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
