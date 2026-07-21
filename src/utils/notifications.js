export const notificationCategories = ['security', 'assignment', 'deadline', 'editorial', 'revision', 'files', 'production', 'publication', 'support', 'system'];
export const notificationPriorities = ['critical', 'high', 'normal', 'low'];

export function safeNotificationHref(deepLink) {
  const href = deepLink?.href;
  if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return null;
  const allowed = [
    /^\/admin(?:\/|$)/,
    /^\/magazines\/[^/]+\/articles\/[^/]+$/,
    /^\/journals\/[^/]+\/articles\/[^/]+$/,
  ];
  return allowed.some((pattern) => pattern.test(href)) ? href : null;
}

export function relativeTime(value) {
  const date = new Date(value);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const ranges = [
    ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400],
    ['hour', 3600], ['minute', 60], ['second', 1],
  ];
  for (const [unit, divisor] of ranges) {
    if (Math.abs(seconds) >= divisor || unit === 'second') return formatter.format(Math.round(seconds / divisor), unit);
  }
  return 'now';
}

export function exactTime(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
