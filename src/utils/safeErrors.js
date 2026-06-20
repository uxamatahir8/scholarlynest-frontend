const ALLOWED_MESSAGE_KEYS = new Set([
  'verification_required',
  '2fa_required',
  'account_already_exists',
  'no_account_exists',
]);

export const safeApiMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const message = error?.response?.data?.message;
  if (typeof message === 'string' && ALLOWED_MESSAGE_KEYS.has(message)) {
    return message;
  }
  return fallback;
};
