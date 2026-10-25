import { useState } from 'react';

const DISMISSED_KEY = 'vr:install-hint-dismissed';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
}

function isMobile(): boolean {
  return /Mobi|iPhone|iPad|Android/i.test(window.navigator.userAgent);
}

/**
 * One-time hint on the library screen: mobile browsers (notably Safari) may
 * clear a site's IndexedDB after ~7 days without a visit — installed home-
 * screen PWAs are exempt. Educates rather than risks silent book loss.
 */
export default function InstallHint() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      return true; // storage blocked → don't nag
    }
  });

  if (dismissed || isStandalone() || !isMobile()) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      /* private mode — state alone is fine */
    }
  };

  return (
    <div className="mt-6 flex items-start justify-between gap-4 rounded-md border border-border bg-surface px-5 py-4">
      <div className="text-text-muted text-sm font-mono leading-relaxed">
        Browsers can clear stored books for sites you don't visit for a week.
        Install VelocityRead to your home screen (Share → Add to Home Screen)
        to keep your library.
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss install hint"
        className="shrink-0 text-text-muted hover:text-text font-mono text-sm select-none"
      >
        ×
      </button>
    </div>
  );
}
