import { db } from '@/core/db';
import { eventLog } from '@/config/db/schema';
import { getUuid } from '@/lib/hash';

type AnalyticsProperties = Record<string, unknown>;

type ServerAnalyticsEvent = {
  eventName: string;
  eventVersion?: string;
  project?: string;
  source?: string;
  anonymousId?: string | null;
  userId?: string | null;
  orderNo?: string | null;
  credentialId?: string | null;
  credentialCode?: string | null;
  clientUuid?: string | null;
  sessionId?: string | null;
  appVersion?: string | null;
  pagePath?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  channel?: string | null;
  landingPage?: string | null;
  attributionConfidence?: string | null;
  locale?: string | null;
  properties?: AnalyticsProperties;
  occurredAt?: Date;
};

function trimValue(value: string | null | undefined, limit: number) {
  return String(value || '').slice(0, limit);
}

export async function recordServerAnalyticsEvent(event: ServerAnalyticsEvent) {
  if (!event.eventName) return;

  try {
    await db()
      .insert(eventLog)
      .values({
        id: getUuid(),
        eventName: trimValue(event.eventName, 120),
        eventVersion: trimValue(event.eventVersion || '1', 40),
        project: trimValue(event.project || 'mediaclaw_web', 120),
        source: trimValue(event.source || 'server', 80),
        anonymousId: trimValue(event.anonymousId, 191),
        userId: trimValue(event.userId, 191),
        orderNo: trimValue(event.orderNo, 191),
        credentialId: trimValue(event.credentialId, 191),
        credentialCode: trimValue(event.credentialCode, 191),
        clientUuid: trimValue(event.clientUuid, 191),
        sessionId: trimValue(event.sessionId, 191),
        appVersion: trimValue(event.appVersion, 80),
        pagePath: trimValue(event.pagePath, 500),
        referrer: trimValue(event.referrer, 500),
        utmSource: trimValue(event.utmSource, 120),
        utmMedium: trimValue(event.utmMedium, 120),
        utmCampaign: trimValue(event.utmCampaign, 120),
        utmContent: trimValue(event.utmContent, 120),
        utmTerm: trimValue(event.utmTerm, 120),
        channel: trimValue(event.channel, 120),
        landingPage: trimValue(event.landingPage, 500),
        attributionConfidence: trimValue(event.attributionConfidence, 40),
        locale: trimValue(event.locale, 20),
        propertiesJson: JSON.stringify(event.properties || {}),
        occurredAt: event.occurredAt || new Date(),
      });
  } catch (error) {
    console.warn('[server-analytics] dropped event', event.eventName, error);
  }
}
