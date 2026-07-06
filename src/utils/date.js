const DEFAULT_DATE_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric' };
const DEFAULT_DATE_TIME_OPTIONS = { ...DEFAULT_DATE_OPTIONS, hour: '2-digit', minute: '2-digit' };

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value, options = DEFAULT_DATE_OPTIONS) {
  const date = toDate(value);
  if (!date) return 'Not recorded';
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export function formatDateTime(value, options = DEFAULT_DATE_TIME_OPTIONS) {
  const date = toDate(value);
  if (!date) return 'Not recorded';
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export function formatRelativeDate(value) {
  const date = toDate(value);
  if (!date) return 'Not recorded';

  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / 86400000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / 3600000);
    if (Math.abs(diffHours) < 1) {
      const diffMinutes = Math.round(diffMs / 60000);
      return formatter.format(diffMinutes, 'minute');
    }
    return formatter.format(diffHours, 'hour');
  }

  if (Math.abs(diffDays) < 30) return formatter.format(diffDays, 'day');
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return formatter.format(diffMonths, 'month');
  return formatter.format(Math.round(diffMonths / 12), 'year');
}
