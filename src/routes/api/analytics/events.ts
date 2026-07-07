import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { db } from '@/core/db';
import { eventLog } from '@/config/db/schema';
import { getUuid } from '@/lib/hash';
import { respData } from '@/lib/resp';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function withCors(response: Response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST({ request }: { request: Request }) {
  const body = await request.json().catch(() => ({}));
  const payload = body && typeof body === 'object' ? body : {};
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = (payload as Record<string, unknown>)[key];
      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
    }
    return '';
  };
  const eventName = pick('eventName', 'event_name').slice(0, 120);
  const properties =
    (payload as Record<string, unknown>).properties &&
    typeof (payload as Record<string, unknown>).properties === 'object'
      ? ((payload as Record<string, unknown>).properties as Record<
          string,
          unknown
        >)
      : {};
  const pickProperty = (...keys: string[]) => {
    for (const key of keys) {
      const value =
        (payload as Record<string, unknown>)[key] ?? properties[key];
      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
    }
    return '';
  };
  const auth = getAuth();
  const session = await auth.api
    .getSession({ headers: request.headers })
    .catch(() => null);
  const occurredAtValue = pickProperty('occurredAt', 'occurred_at');
  const occurredAt = occurredAtValue ? new Date(occurredAtValue) : new Date();
  const safeOccurredAt = Number.isNaN(occurredAt.getTime())
    ? new Date()
    : occurredAt;

  if (eventName) {
    await db()
      .insert(eventLog)
      .values({
        id: getUuid(),
        eventName,
        eventVersion: pickProperty('eventVersion', 'event_version') || '1',
        project: pickProperty('project') || 'mediaclaw_web',
        source: pickProperty('source') || 'web',
        anonymousId: pickProperty('anonymousId', 'anonymous_id').slice(0, 191),
        userId: (session?.user?.id || pickProperty('userId', 'user_id')).slice(
          0,
          191
        ),
        orderNo: pickProperty('orderNo', 'order_no').slice(0, 191),
        credentialId: pickProperty('credentialId', 'credential_id').slice(
          0,
          191
        ),
        credentialCode: pickProperty('credentialCode', 'credential_code').slice(
          0,
          191
        ),
        clientUuid: pickProperty('clientUuid', 'client_uuid').slice(0, 191),
        sessionId: pickProperty('sessionId', 'session_id').slice(0, 191),
        appVersion: pickProperty('appVersion', 'app_version').slice(0, 80),
        pagePath: pickProperty('pagePath', 'page_path').slice(0, 500),
        referrer: pickProperty('referrer').slice(0, 500),
        utmSource: pickProperty('utmSource', 'utm_source').slice(0, 120),
        utmMedium: pickProperty('utmMedium', 'utm_medium').slice(0, 120),
        utmCampaign: pickProperty('utmCampaign', 'utm_campaign').slice(0, 120),
        locale: pickProperty('locale').slice(0, 20),
        propertiesJson: JSON.stringify(properties || {}),
        occurredAt: safeOccurredAt,
      })
      .catch((error) => {
        console.warn('[analytics.events] dropped event', error);
      });
  }

  return withCors(
    respData({
      accepted: true,
      eventName: eventName || 'unknown',
    })
  );
}

export const Route = createFileRoute('/api/analytics/events')({
  server: {
    handlers: { OPTIONS, POST },
  },
});
