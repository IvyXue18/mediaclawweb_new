import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { db } from '@/core/db';
import { envConfigs } from '@/config';
import { eventLog } from '@/config/db/schema';
import { getUuid } from '@/lib/hash';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';

const MAX_BODY_BYTES = 32 * 1024;
const MAX_EVENT_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_EVENT_FUTURE_MS = 5 * 60 * 1000;

const ALLOWED_CLIENT_EVENTS = new Set([
  'page_view',
  'pricing_view',
  'download_click',
  'chrome_store_click',
  'sign_up_success',
  'trial_claim_started',
  'trial_claim_success',
  'extension_opened',
  'credential_verify_success',
  'feature_gate_shown',
  'trial_cta_clicked',
  'pricing_cta_clicked',
  'feature_used',
  'nav_open',
  'nav_platform_select',
  'nav_feature_click',
  'nav_more_expand',
  'contextual_link_click',
  'hub_primary_cta_click',
  'hub_secondary_cta_click',
  'hub_cross_platform_click',
  'hub_scene_click',
  'hub_feature_impression',
  'hub_feature_click',
  'hub_workflow_tab',
  'hub_integration_click',
]);

function allowedOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return '';
  const requestOrigin = new URL(request.url).origin;
  let appOrigin = requestOrigin;
  try {
    appOrigin = new URL(envConfigs.app_url || requestOrigin).origin;
  } catch {}
  if (origin === requestOrigin || origin === appOrigin) return origin;
  if (/^(chrome|moz)-extension:\/\/[a-z0-9-]+$/i.test(origin)) return origin;
  return null;
}

function corsHeaders(request: Request) {
  const origin = allowedOrigin(request);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
    'Cache-Control': 'no-store',
  };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function responseJson(
  request: Request,
  body: Record<string, unknown>,
  status = 200
) {
  return Response.json(body, {
    status,
    headers: corsHeaders(request),
  });
}

function errorResponse(request: Request, message: string, status: number) {
  return responseJson(
    request,
    {
      code: status,
      ok: false,
      status: 'error',
      message,
      data: null,
    },
    status
  );
}

function safeOccurredAt(value: string) {
  const now = Date.now();
  const parsed = value ? new Date(value) : new Date(now);
  const timestamp = parsed.getTime();
  if (
    !Number.isFinite(timestamp) ||
    timestamp < now - MAX_EVENT_AGE_MS ||
    timestamp > now + MAX_EVENT_FUTURE_MS
  ) {
    return new Date(now);
  }
  return parsed;
}

export async function OPTIONS({ request }: { request: Request }) {
  if (allowedOrigin(request) === null) {
    return errorResponse(request, 'Origin is not allowed', 403);
  }
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

export async function POST({ request }: { request: Request }) {
  if (allowedOrigin(request) === null) {
    return errorResponse(request, 'Origin is not allowed', 403);
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return errorResponse(request, 'Analytics payload is too large', 413);
  }

  const rawBody = await request.text().catch(() => '');
  if (!rawBody || rawBody.length > MAX_BODY_BYTES) {
    return errorResponse(
      request,
      rawBody ? 'Analytics payload is too large' : 'Invalid JSON payload',
      rawBody ? 413 : 400
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return errorResponse(request, 'Invalid JSON payload', 400);
  }

  const payload =
    body && typeof body === 'object'
      ? (body as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  const properties =
    payload.properties && typeof payload.properties === 'object'
      ? (payload.properties as Record<string, unknown>)
      : {};
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = payload[key] ?? properties[key];
      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
    }
    return '';
  };

  const eventName = pick('eventName', 'event_name').slice(0, 120);
  if (!ALLOWED_CLIENT_EVENTS.has(eventName)) {
    return errorResponse(request, 'Unsupported analytics event', 400);
  }

  const source = pick('source').slice(0, 80) || 'web';
  if (!['web', 'extension'].includes(source)) {
    return errorResponse(request, 'Unsupported analytics source', 400);
  }

  const anonymousId = pick('anonymousId', 'anonymous_id').slice(0, 191);
  const sessionId = pick('sessionId', 'session_id').slice(0, 191);
  const clientUuid = pick('clientUuid', 'client_uuid').slice(0, 191);
  if (source === 'web' && !anonymousId && !sessionId) {
    return errorResponse(request, 'Missing analytics identity', 400);
  }
  if (source === 'extension' && !clientUuid) {
    return errorResponse(request, 'Missing extension identity', 400);
  }

  const limited = enforceMinIntervalRateLimit(request, {
    intervalMs: 50,
    keyPrefix: 'analytics-event',
    extraKey: `${source}:${eventName}:${anonymousId || clientUuid || sessionId}`,
  });
  if (limited) {
    Object.entries(corsHeaders(request)).forEach(([key, value]) => {
      limited.headers.set(key, value);
    });
    return limited;
  }

  const auth = getAuth();
  const session = await auth.api
    .getSession({ headers: request.headers })
    .catch(() => null);

  await db()
    .insert(eventLog)
    .values({
      id: getUuid(),
      eventName,
      eventVersion: pick('eventVersion', 'event_version').slice(0, 40) || '1',
      project: pick('project').slice(0, 120) || 'mediaclaw_web',
      source,
      anonymousId,
      userId: session?.user?.id?.slice(0, 191) || '',
      orderNo: pick('orderNo', 'order_no').slice(0, 191),
      credentialId: pick('credentialId', 'credential_id').slice(0, 191),
      credentialCode: pick('credentialCode', 'credential_code').slice(0, 191),
      clientUuid,
      sessionId,
      appVersion: pick('appVersion', 'app_version').slice(0, 80),
      pagePath: pick('pagePath', 'page_path').slice(0, 500),
      referrer: pick('referrer').slice(0, 500),
      utmSource: pick('utmSource', 'utm_source').slice(0, 120),
      utmMedium: pick('utmMedium', 'utm_medium').slice(0, 120),
      utmCampaign: pick('utmCampaign', 'utm_campaign').slice(0, 120),
      utmContent: pick('utmContent', 'utm_content').slice(0, 120),
      utmTerm: pick('utmTerm', 'utm_term').slice(0, 120),
      channel: pick('channel').slice(0, 120),
      landingPage: pick('landingPage', 'landing_page').slice(0, 500),
      attributionConfidence: pick(
        'attributionConfidence',
        'attribution_confidence'
      ).slice(0, 40),
      locale: pick('locale').slice(0, 20),
      propertiesJson: JSON.stringify(properties),
      occurredAt: safeOccurredAt(pick('occurredAt', 'occurred_at')),
    })
    .catch((error) => {
      console.warn('[analytics.events] dropped event', error);
    });

  return responseJson(request, {
    code: 0,
    ok: true,
    status: 'ok',
    reason: 'none',
    message: 'ok',
    data: { accepted: true, eventName },
  });
}

export const Route = createFileRoute('/api/analytics/events')({
  server: {
    handlers: { OPTIONS, POST },
  },
});
