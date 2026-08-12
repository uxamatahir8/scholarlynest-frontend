const ALLOWED_MESSAGE_KEYS = new Set([
  'verification_required',
  '2fa_required',
  'no_account_exists',
  'Registration is currently closed.',
]);

const MFA_METHODS = new Set(['email', 'totp', 'recovery_code']);
const INTERNAL_DETAIL_PATTERN = /(?:exception|stack trace|sqlstate|\/(?:home|srv|var)\/|\bat\s+\S+:\d+)/i;

const responsePayload = (error) => {
  const payload = error?.['response']?.data;
  return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null;
};

const safeText = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized || normalized.length > 300 || INTERNAL_DETAIL_PATTERN.test(normalized)) return null;
  return normalized;
};

export const safeApiMessage = (error, fallback = 'We could not complete that request. Please try again.', options = {}) => {
  const strict = options.strict === true;
  const status = error?.[ 'response' ]?.status;

  if (typeof error?.userMessage === 'string' && error.userMessage.trim()) {
    if (!strict) return error.userMessage;
    if (Number.isFinite(status) && status >= 500) return fallback;
    return safeText(error.userMessage) || fallback;
  }

  if (status === 429) {
    const retryAfter = Number(error?.response?.headers?.['retry-after']);
    return Number.isFinite(retryAfter) && retryAfter > 0
      ? `Too many attempts. Please wait ${retryAfter} seconds and try again.`
      : 'Too many attempts. Please wait a moment and try again.';
  }

  if (strict && Number.isFinite(status) && status >= 500) {
    return fallback;
  }

  const rawMessage = responsePayload(error)?.message;
  const message = strict ? safeText(rawMessage) : rawMessage;

  if (typeof message === 'string') {
    if (ALLOWED_MESSAGE_KEYS.has(message)) {
      return message;
    }

    const msg = message.toLowerCase();

    // Check credentials / sign-in patterns
    if (msg.includes('credentials') || msg.includes('login') || msg.includes('match our records') || msg.includes('unauthenticated')) {
      return 'Unable to sign in. Check your email and password, then try again.';
    }

    // Check verification / 2FA patterns
    if (
      msg.includes('verification code') ||
      msg.includes('2fa code') ||
      msg.includes('invalid verification') ||
      msg.includes('expired verification') ||
      msg.includes('invalid 2fa') ||
      msg.includes('expired 2fa') ||
      msg.includes('invalid password change code') ||
      msg.includes('password change code has expired')
    ) {
      return 'This verification code is invalid or expired.';
    }

    // Check reset token patterns
    if (
      msg.includes('reset code') ||
      msg.includes('reset token') ||
      msg.includes('invalid reset') ||
      msg.includes('expired reset') ||
      msg.includes('password reset code')
    ) {
      return 'Your password reset link is invalid or has expired.';
    }

    // Check existing account constraints
    if (msg.includes('account_already_exists') || msg.includes('already exists') || msg.includes('email has already been taken')) {
      return 'An account already exists with this email.';
    }

    // Return any other custom API error message directly
    return message;
  }

  // Handle visual context boundaries from the fallback strings
  const lowerFallback = fallback.toLowerCase();
  if (lowerFallback.includes('sign in') || lowerFallback.includes('login') || lowerFallback.includes('credential')) {
    return 'Unable to sign in. Check your email and password, then try again.';
  }
  if (lowerFallback.includes('verification') || lowerFallback.includes('code') || lowerFallback.includes('otp')) {
    return 'This verification code is invalid or expired.';
  }
  if (lowerFallback.includes('reset') || lowerFallback.includes('link') || lowerFallback.includes('token') || lowerFallback.includes('recover')) {
    return 'Your password reset link is invalid or has expired.';
  }

  return fallback;
};

export const safeMfaChallengeState = (error) => {
  if (error?.['response']?.status !== 422) return null;
  const payload = responsePayload(error);
  if (!payload) return null;

  const safeMethods = (value) => Array.isArray(value)
    ? value.filter((method) => typeof method === 'string' && MFA_METHODS.has(method))
    : null;
  const requiredMethods = safeMethods(payload.required_methods);
  const verifiedMethods = safeMethods(payload.verified_methods);
  const remainingMethods = safeMethods(payload.remaining_methods);
  const nextMethod = payload.next_method === null || MFA_METHODS.has(payload.next_method)
    ? payload.next_method
    : undefined;
  const state = {};

  if (requiredMethods) state.required_methods = requiredMethods;
  if (verifiedMethods) state.verified_methods = verifiedMethods;
  if (remainingMethods) state.remaining_methods = remainingMethods;
  if (nextMethod !== undefined) state.next_method = nextMethod;
  if (typeof payload.recovery_code_allowed === 'boolean') {
    state.recovery_code_allowed = payload.recovery_code_allowed;
  }

  return Object.keys(state).length ? state : null;
};

export const safeApiValidationErrors = (error, allowedFields = []) => {
  if (error?.['response']?.status !== 422) return {};
  const rawErrors = responsePayload(error)?.errors;
  if (!rawErrors || typeof rawErrors !== 'object' || Array.isArray(rawErrors)) return {};

  const allowed = new Set(allowedFields);
  return Object.entries(rawErrors).reduce((result, [field, messages]) => {
    const baseField = field.split('.')[0];
    if (!allowed.has(baseField)) return result;
    const safeMessages = (Array.isArray(messages) ? messages : [messages])
      .map(safeText)
      .filter(Boolean);
    if (safeMessages.length) {
      result[baseField] = [...(result[baseField] || []), ...safeMessages];
    }
    return result;
  }, {});
};
