'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Settings, Activity, Megaphone, Share2 } from 'lucide-react';
import { Button } from './ui/Button';
import Dialog from './ui/Dialog';

const STORAGE_KEY = 'scholarlynest-cookie-consent';

function Toggle({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
        checked ? 'bg-amber-600' : 'bg-zinc-200 dark:bg-zinc-700'
      } ${disabled ? 'opacity-55 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-250 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    social: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setVisible(true);
    } else {
      try {
        if (saved === 'accepted') {
          setPreferences({
            essential: true,
            functional: true,
            analytics: true,
            marketing: true,
            social: true,
          });
        } else if (saved === 'rejected') {
          setPreferences({
            essential: true,
            functional: false,
            analytics: false,
            marketing: false,
            social: false,
          });
        } else {
          const parsed = JSON.parse(saved);
          setPreferences({
            essential: true,
            functional: !!parsed.functional,
            analytics: !!parsed.analytics,
            marketing: !!parsed.marketing,
            social: !!parsed.social,
          });
        }
      } catch (e) {
        setVisible(true);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      social: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setVisible(false);
  };

  const handleRejectAll = () => {
    const allRejected = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      social: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRejected));
    setPreferences(allRejected);
    setVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    setShowPreferences(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <aside className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-4xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl sm:flex sm:items-center sm:gap-5" role="dialog" aria-label="Cookie notice">
        <p className="flex-1 text-sm leading-relaxed text-[var(--muted)]">
          We use cookies to improve your experience, analyze site usage, and support essential platform functionality. You can customize your preferences or agree to all.{' '}
          <Link href="/privacy" className="font-bold text-amber-700 underline dark:text-amber-300">
            Privacy policy
          </Link>
        </p>
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-0 sm:flex-nowrap shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowPreferences(true)}>
            Preferences
          </Button>
          <Button variant="outline" size="sm" onClick={handleRejectAll}>
            Reject All
          </Button>
          <Button variant="gold" size="sm" onClick={handleAcceptAll}>
            Accept All
          </Button>
        </div>
      </aside>

      <Dialog
        open={showPreferences}
        onClose={() => setShowPreferences(false)}
        title="Cookie Preferences"
        description="We use cookies to optimize your platform experience. Custom settings can be changed below at any time."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowPreferences(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleSavePreferences}>
              Save Choices
            </Button>
          </>
        }
      >
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          {/* Essential Cookies */}
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div className="flex gap-3">
              <div className="mt-1 text-amber-600 dark:text-amber-500 shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Strictly Necessary</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed mt-0.5">
                  Essential for basic page navigation, secure sign-in, session state, and security validation. These cannot be disabled.
                </p>
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <Toggle checked={preferences.essential} disabled={true} />
            </div>
          </div>

          {/* Functional Cookies */}
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div className="flex gap-3">
              <div className="mt-1 text-amber-600 dark:text-amber-500 shrink-0">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Functional & Preferences</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed mt-0.5">
                  Remember custom layout states, theme configurations, and font adjustments to ensure a personalized viewing experience.
                </p>
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <Toggle
                checked={preferences.functional}
                onChange={() => setPreferences((prev) => ({ ...prev, functional: !prev.functional }))}
              />
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div className="flex gap-3">
              <div className="mt-1 text-amber-600 dark:text-amber-500 shrink-0">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Analytics & Performance</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed mt-0.5">
                  Track anonymous aggregate stats, page views, and error rates to monitor speeds and optimize our service.
                </p>
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <Toggle
                checked={preferences.analytics}
                onChange={() => setPreferences((prev) => ({ ...prev, analytics: !prev.analytics }))}
              />
            </div>
          </div>

          {/* Marketing Cookies */}
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div className="flex gap-3">
              <div className="mt-1 text-amber-600 dark:text-amber-500 shrink-0">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Marketing & Advertising</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed mt-0.5">
                  Enable targeted communication, highlight relevant posts, and optimize product announcements.
                </p>
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <Toggle
                checked={preferences.marketing}
                onChange={() => setPreferences((prev) => ({ ...prev, marketing: !prev.marketing }))}
              />
            </div>
          </div>

          {/* Social Media Cookies */}
          <div className="flex items-start justify-between gap-4 pb-2">
            <div className="flex gap-3">
              <div className="mt-1 text-amber-600 dark:text-amber-500 shrink-0">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Social Media & Sharing</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed mt-0.5">
                  Support content sharing buttons, embedded platforms, and custom commenting integrations.
                </p>
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <Toggle
                checked={preferences.social}
                onChange={() => setPreferences((prev) => ({ ...prev, social: !prev.social }))}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
