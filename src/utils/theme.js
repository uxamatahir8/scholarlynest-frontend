export const THEME_STORAGE_KEY = 'theme-selection';
export const THEME_OPTIONS = ['light', 'dark', 'system'];

export function getStoredTheme() {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return THEME_OPTIONS.includes(stored) ? stored : 'light';
}

export function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme = getStoredTheme()) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const resolved = theme === 'system' ? getSystemTheme() : theme;

  root.classList.toggle('dark', resolved === 'dark');
  root.classList.toggle('light', resolved !== 'dark');
}

export function setTheme(theme) {
  if (typeof window === 'undefined') return;
  const nextTheme = THEME_OPTIONS.includes(theme) ? theme : 'light';
  window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  applyTheme(nextTheme);
}
