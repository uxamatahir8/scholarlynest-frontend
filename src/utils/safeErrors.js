const ALLOWED_MESSAGE_KEYS = new Set([
  'verification_required',
  '2fa_required',
  'no_account_exists',
  'Registration is currently closed.',
]);

export const safeApiMessage = (error, fallback = 'We could not complete that request. Please try again.') => {
  const message = error?.[ 'response' ]?.data?.message;

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
  }

  const status = error?.[ 'response' ]?.status;
  if (status === 429) {
    return 'We could not complete that request. Please try again.';
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
