const BROWSER_INSTALL_ID_KEY = 'mediaclaw_browser_install_id';

/**
 * Return the stable, anonymous identifier used by welfare eligibility checks.
 * This is intentionally a lightweight anti-abuse signal rather than a device
 * fingerprint: clearing browser storage creates a new identifier.
 */
export function getBrowserInstallId(): string {
  if (typeof window === 'undefined') return '';

  const existing = window.localStorage.getItem(BROWSER_INSTALL_ID_KEY);
  if (existing) return existing;

  const next =
    typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(BROWSER_INSTALL_ID_KEY, next);
  return next;
}
