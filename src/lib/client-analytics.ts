import {
  ATTRIBUTION_COOKIE_NAME,
  ATTRIBUTION_MAX_AGE_DAYS,
  ATTRIBUTION_STORAGE_KEY,
  deriveAttributionTouch,
  mergeAttributionState,
  parseAttributionEnvelope,
  serializeAttributionEnvelope,
  type AttributionEnvelope,
  type AttributionState,
} from '@/lib/analytics-attribution';

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

function persistAttributionEnvelope(envelope: AttributionEnvelope) {
  const value = serializeAttributionEnvelope(envelope);
  writeStorage(ATTRIBUTION_STORAGE_KEY, value);
  const maxAge = ATTRIBUTION_MAX_AGE_DAYS * 24 * 60 * 60;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${ATTRIBUTION_COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

function captureCurrentAttribution(
  anonymousId: string,
  sessionId: string
): AttributionEnvelope {
  const previous = parseAttributionEnvelope(
    readStorage(ATTRIBUTION_STORAGE_KEY)
  );
  const touch = deriveAttributionTouch({
    pageUrl: window.location.href,
    referrer: document.referrer,
    userAgent: window.navigator.userAgent,
  });
  const state: AttributionState = mergeAttributionState(previous, touch);
  const envelope: AttributionEnvelope = {
    ...state,
    anonymousId,
    sessionId,
  };
  persistAttributionEnvelope(envelope);
  return envelope;
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
      utmContent: '',
      utmTerm: '',
      channel: '',
      landingPage: '',
      attributionConfidence: '',
      attribution: null,
    };
  }

  const anonymousId = getAnonymousId();
  const sessionId = getSessionId();
  const attribution = captureCurrentAttribution(anonymousId, sessionId);
  const lastTouch = attribution.lastTouch;

  return {
    anonymousId,
    sessionId,
    pagePath: `${window.location.pathname}${window.location.search}`,
    referrer: lastTouch.referrer || document.referrer || '',
    utmSource: lastTouch.source || currentSearchParam('utm_source'),
    utmMedium: lastTouch.medium || currentSearchParam('utm_medium'),
    utmCampaign: lastTouch.campaign || currentSearchParam('utm_campaign'),
    utmContent: lastTouch.content || currentSearchParam('utm_content'),
    utmTerm: lastTouch.term || currentSearchParam('utm_term'),
    channel: lastTouch.channel,
    landingPage: lastTouch.landingPage,
    attributionConfidence: lastTouch.confidence,
    attribution,
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
        utmContent: context.utmContent,
        utmTerm: context.utmTerm,
        channel: context.channel,
        landingPage: context.landingPage,
        attributionConfidence: context.attributionConfidence,
        properties,
      }),
    }).catch(() => {});
  } catch {}
}

// The events endpoint rate-limits to one request per 50ms per
// (source, eventName, anonymousId), so bursts of same-named events — several
// impressions from one menu open, for example — need spacing or the tail is
// dropped. Callers with bursty events should queue instead of firing directly.
const QUEUE_INTERVAL_MS = 160;
const queue: Array<() => void> = [];
let queueTimer: ReturnType<typeof setTimeout> | null = null;

function drainQueue() {
  const send = queue.shift();
  send?.();
  queueTimer = queue.length ? setTimeout(drainQueue, QUEUE_INTERVAL_MS) : null;
}

export function queueAnalyticsEventSafe(
  eventName: string,
  properties: AnalyticsProperties = {},
  options: { source?: string; pagePath?: string } = {}
) {
  if (typeof window === 'undefined' || !eventName) return;
  queue.push(() => recordAnalyticsEventSafe(eventName, properties, options));
  if (!queueTimer) queueTimer = setTimeout(drainQueue, 0);
}
