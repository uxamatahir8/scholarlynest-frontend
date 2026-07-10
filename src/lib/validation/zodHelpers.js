import { z } from 'zod';

export const requiredString = (label, max = 255) => z.string().trim().min(1, `${label} is required.`).max(max, `${label} must not exceed ${max} characters.`);
export const optionalString = (label, max = 255) => z.string().trim().max(max, `${label} must not exceed ${max} characters.`).optional().or(z.literal(''));
export const emailField = (label = 'Email') => z.string().trim().min(1, `${label} is required.`).email(`Enter a valid ${label.toLowerCase()} address.`);
export const passwordField = z.string().min(1, 'Password is required.').min(8, 'Password must be at least 8 characters.');
export const idField = z.coerce.number().int().positive('Select a valid option.');

export function validateWithZod(schema, values) {
  const result = schema.safeParse(values);
  if (result.success) return { success: true, data: result.data, errors: {}, message: '' };
  return { success: false, errors: normalizeZodErrors(result.error), message: 'Please correct the highlighted fields.' };
}

export function normalizeZodErrors(error) {
  const errors = {};
  (error?.issues || []).forEach((issue) => {
    const key = issue.path.length ? issue.path.join('.') : '_form';
    if (!errors[key]) errors[key] = issue.message;
  });
  return errors;
}

export function mergeFrontendAndBackendErrors(frontendErrors = {}, backendErrors = {}) {
  return { ...frontendErrors, ...Object.fromEntries(Object.entries(backendErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])) };
}

export function backendErrorsFromResponse(error) {
  const response = error?.response?.data;
  return mergeFrontendAndBackendErrors({}, response?.errors || {});
}
