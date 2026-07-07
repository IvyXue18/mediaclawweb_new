type AnalyticsProperties = Record<string, unknown>;

const ANONYMOUS_ID_KEY = 'mc_anonymous_id';
const SESSION_ID_KEY = 'mc_session_id';
const SESSION_LAST_SEEN_KEY = 'mc_session_last_seen_at';
const SESSION_TTL_MS = 30 * 60 * 1000;

function createId() {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function getAnonymousId() {
  const existing = readStorage(ANONYMOUS_ID_KEY);
  if (existing) return existing;
  const next = createId();
  writeStorage(ANONYMOUS_ID_KEY, next);
  return next;
}

function getSessionId() {
  const now = Date.now();
  const lastSeenAt = Number(readStorage(SESSION_LAST_SEEN_KEY) || 0);
  const current = readStorage(SESSION_ID_KEY);
  const expired = !lastSeenAt || now - lastSeenAt > SESSION_TTL_MS;
  const next = expired || !current ? createId() : current;
  writeStorage(SESSION_ID_KEY, next);
  writeStorage(SESSION_LAST_SEEN_KEY, String(now));
  return next;
}

function currentSearchParam(name: string) {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(name) || '';
}

export function getCurrentAnalyticsContext() {
  if (typeof window === 'undefined') {
    return {
      anonymousId: '',
      sessionId: '',
      pagePath: '',
      referrer: '',
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
    };
  }

  return {
    anonymousId: getAnonymousId(),
    sessionId: getSessionId(),
    pagePath: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || '',
    utmSource: currentSearchParam('utm_source'),
    utmMedium: currentSearchParam('utm_medium'),
    utmCampaign: currentSearchParam('utm_campaign'),
  };
}

export function recordAnalyticsEventSafe(
  eventName: string,
  properties: AnalyticsProperties = {},
  options: { source?: string; pagePath?: string } = {}
) {
  if (typeof window === 'undefined' || !eventName) return;

  try {
    const context = getCurrentAnalyticsContext();
    void fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        eventName,
        source: options.source || 'web',
        anonymousId: context.anonymousId,
        sessionId: context.sessionId,
        pagePath: options.pagePath || context.pagePath,
        referrer: context.referrer,
        utmSource: context.utmSource,
        utmMedium: context.utmMedium,
        utmCampaign: context.utmCampaign,
        properties,
      }),
    }).catch(() => {});
  } catch {}
}
