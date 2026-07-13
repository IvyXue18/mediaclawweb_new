export const ATTRIBUTION_COOKIE_NAME = 'mc_attribution_v1';
export const ATTRIBUTION_STORAGE_KEY = 'mc_attribution_v1';
export const ATTRIBUTION_MAX_AGE_DAYS = 90;

export type AttributionEvidence =
  | 'campaign'
  | 'referrer'
  | 'environment'
  | 'direct';

export type AttributionConfidence =
  | 'deterministic'
  | 'channel_only'
  | 'inferred'
  | 'unknown';

export type AttributionTouch = {
  channel: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  clickId: string;
  referrer: string;
  referrerHost: string;
  landingPage: string;
  evidence: AttributionEvidence;
  confidence: AttributionConfidence;
  capturedAt: string;
};

export type AttributionState = {
  version: 1;
  firstTouch: AttributionTouch;
  lastTouch: AttributionTouch;
};

export type AttributionEnvelope = AttributionState & {
  anonymousId: string;
  sessionId: string;
};

const PLATFORM_SOURCE_ALIASES: Record<string, string> = {
  wechat: 'wechat',
  weixin: 'wechat',
  wx: 'wechat',
  twitter: 'x',
  x: 'x',
  google: 'google',
  youtube: 'youtube',
  linkedin: 'linkedin',
  facebook: 'facebook',
  instagram: 'instagram',
  reddit: 'reddit',
  bing: 'bing',
  baidu: 'baidu',
  zhihu: 'zhihu',
  xiaohongshu: 'xiaohongshu',
  extension: 'extension',
};

function clean(value: unknown, limit = 191) {
  return String(value || '')
    .trim()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, limit);
}

function cleanToken(value: unknown, limit = 120) {
  return clean(value, limit).toLowerCase().replace(/\s+/g, '_');
}

function safeUrl(value: string, base?: string) {
  try {
    return new URL(value, base);
  } catch {
    return null;
  }
}

function safeReferrer(value: string) {
  const url = safeUrl(value);
  if (!url || !['http:', 'https:'].includes(url.protocol)) return '';
  return `${url.origin}${url.pathname}`.slice(0, 500);
}

function channelFromSource(source: string) {
  const normalized = cleanToken(source);
  return PLATFORM_SOURCE_ALIASES[normalized] || normalized;
}

function channelFromHost(host: string) {
  const value = host.toLowerCase().replace(/^www\./, '');
  if (!value) return '';
  if (value === 't.co' || value === 'x.com' || value.endsWith('.twitter.com'))
    return 'x';
  if (
    value === 'mp.weixin.qq.com' ||
    value === 'weixin.qq.com' ||
    value.endsWith('.weixin.qq.com')
  )
    return 'wechat';
  if (value.includes('google.')) return 'google';
  if (value === 'youtu.be' || value.endsWith('.youtube.com')) return 'youtube';
  if (value.endsWith('.linkedin.com')) return 'linkedin';
  if (value.endsWith('.facebook.com')) return 'facebook';
  if (value.endsWith('.instagram.com')) return 'instagram';
  if (value.endsWith('.reddit.com')) return 'reddit';
  if (value.includes('bing.com')) return 'bing';
  if (value.includes('baidu.com')) return 'baidu';
  if (value.endsWith('.zhihu.com')) return 'zhihu';
  if (value.endsWith('.xiaohongshu.com')) return 'xiaohongshu';
  return 'referral';
}

function getClickId(params: URLSearchParams) {
  const candidates = ['gclid', 'fbclid', 'msclkid', 'ttclid'];
  for (const name of candidates) {
    const value = clean(params.get(name), 191);
    if (value) return { name, value };
  }
  return { name: '', value: '' };
}

function sourceFromClickId(name: string) {
  if (name === 'gclid') return 'google';
  if (name === 'fbclid') return 'facebook';
  if (name === 'msclkid') return 'bing';
  if (name === 'ttclid') return 'tiktok';
  return '';
}

export function deriveAttributionTouch(input: {
  pageUrl: string;
  referrer?: string;
  userAgent?: string;
  now?: Date;
}): AttributionTouch {
  const pageUrl = safeUrl(input.pageUrl, 'https://mediaclaw.app');
  const params = pageUrl?.searchParams || new URLSearchParams();
  const utmSource = cleanToken(params.get('utm_source'));
  const simpleSource = cleanToken(params.get('source') || params.get('via'));
  const referralCode = clean(params.get('ref'), 120);
  const clickId = getClickId(params);
  const clickSource = sourceFromClickId(clickId.name);
  const explicitSource = utmSource || simpleSource || clickSource;
  const explicitChannel = channelFromSource(explicitSource);
  const currentOrigin = pageUrl?.origin || '';
  const rawReferrer = clean(input.referrer, 1000);
  const referrerUrl = safeUrl(rawReferrer);
  const externalReferrer =
    referrerUrl && referrerUrl.origin !== currentOrigin ? referrerUrl : null;
  const referrerHost = cleanToken(externalReferrer?.hostname, 191);
  const isWechatEnvironment = /MicroMessenger/i.test(input.userAgent || '');

  let channel = explicitChannel;
  let source = explicitSource;
  let evidence: AttributionEvidence = 'campaign';
  let confidence: AttributionConfidence = 'deterministic';

  if (!channel && referralCode) {
    const referralSource = channelFromSource(referralCode);
    channel = PLATFORM_SOURCE_ALIASES[referralSource]
      ? referralSource
      : 'referral';
    source = channel === 'referral' ? 'referral' : referralSource;
  }

  if (!channel && externalReferrer) {
    channel = channelFromHost(externalReferrer.hostname);
    source = channel === 'referral' ? referrerHost : channel;
    evidence = 'referrer';
    confidence = 'channel_only';
  }

  if (!channel && isWechatEnvironment) {
    channel = 'wechat';
    source = 'wechat';
    evidence = 'environment';
    confidence = 'inferred';
  }

  if (!channel) {
    channel = 'direct';
    source = 'direct';
    evidence = 'direct';
    confidence = 'unknown';
  }

  return {
    channel: cleanToken(channel),
    source: cleanToken(source),
    medium: cleanToken(params.get('utm_medium')),
    campaign: clean(params.get('utm_campaign'), 120),
    content: clean(params.get('utm_content') || referralCode, 120),
    term: clean(params.get('utm_term'), 120),
    clickId: clean(clickId.value, 191),
    referrer: safeReferrer(rawReferrer),
    referrerHost,
    landingPage: clean(
      `${pageUrl?.pathname || '/'}${pageUrl?.search || ''}`,
      500
    ),
    evidence,
    confidence,
    capturedAt: (input.now || new Date()).toISOString(),
  };
}

function isExpired(touch: AttributionTouch, now = new Date()) {
  const timestamp = new Date(touch.capturedAt).getTime();
  if (!Number.isFinite(timestamp)) return true;
  return (
    now.getTime() - timestamp > ATTRIBUTION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  );
}

export function mergeAttributionState(
  previous: AttributionState | null,
  touch: AttributionTouch,
  now = new Date()
): AttributionState {
  const usablePrevious =
    previous && !isExpired(previous.lastTouch, now) ? previous : null;
  if (!usablePrevious) {
    return { version: 1, firstTouch: touch, lastTouch: touch };
  }

  return {
    version: 1,
    firstTouch: usablePrevious.firstTouch,
    lastTouch: touch.evidence === 'direct' ? usablePrevious.lastTouch : touch,
  };
}

function isTouch(value: unknown): value is AttributionTouch {
  if (!value || typeof value !== 'object') return false;
  const touch = value as Partial<AttributionTouch>;
  return Boolean(touch.channel && touch.source && touch.capturedAt);
}

export function parseAttributionEnvelope(
  value: string | null | undefined
): AttributionEnvelope | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(
      decodeURIComponent(value)
    ) as Partial<AttributionEnvelope>;
    if (
      parsed.version !== 1 ||
      !isTouch(parsed.firstTouch) ||
      !isTouch(parsed.lastTouch) ||
      isExpired(parsed.lastTouch)
    ) {
      return null;
    }
    return {
      version: 1,
      anonymousId: clean(parsed.anonymousId, 191),
      sessionId: clean(parsed.sessionId, 191),
      firstTouch: parsed.firstTouch,
      lastTouch: parsed.lastTouch,
    };
  } catch {
    return null;
  }
}

export function serializeAttributionEnvelope(value: AttributionEnvelope) {
  return encodeURIComponent(JSON.stringify(value));
}
