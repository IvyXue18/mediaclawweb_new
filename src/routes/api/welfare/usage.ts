import { createFileRoute } from '@tanstack/react-router';
import { sql } from 'drizzle-orm';

import { db } from '@/core/db';
import { welfareUsageSummary } from '@/config/db/schema';
import { getUuid } from '@/lib/hash';

import {
  codeFromRequest,
  pluginErr,
  pluginOk,
  readJsonBody,
  readWelfareUsage,
  resolvePluginCredentialAccess,
} from '../-plugin-compat';

const EVENT_COLUMNS = {
  core_capture_success: welfareUsageSummary.coreCaptureSuccessCount,
  export_or_copy_success: welfareUsageSummary.exportOrCopySuccessCount,
  sync_success: welfareUsageSummary.syncSuccessCount,
  high_value_click: welfareUsageSummary.highValueClickCount,
  failure_signal: welfareUsageSummary.failureSignalCount,
} as const;

async function GET({ request }: { request: Request }) {
  const result = await resolvePluginCredentialAccess({
    code: codeFromRequest(request),
  });
  if (!result.ok) return pluginErr(result.reason, result.message);

  return pluginOk(
    await readWelfareUsage(result.data.credential.code),
    'welfare usage status loaded'
  );
}

async function POST({ request }: { request: Request }) {
  const body = await readJsonBody(request);
  const result = await resolvePluginCredentialAccess({
    code: codeFromRequest(request, body),
    clientUuid:
      typeof body.clientUuid === 'string' ? body.clientUuid.trim() : undefined,
  });
  if (!result.ok) return pluginErr(result.reason, result.message);

  const eventType =
    typeof body.eventType === 'string' ? body.eventType.trim() : '';
  const eventColumn = EVENT_COLUMNS[eventType as keyof typeof EVENT_COLUMNS];
  if (!eventColumn) {
    return pluginErr('invalid_request', 'unsupported welfare usage event type');
  }

  const now = new Date();
  const clientUuid =
    typeof body.clientUuid === 'string' ? body.clientUuid.trim() : '';
  const increment = 1;
  const insertCounts = {
    coreCaptureSuccessCount: eventType === 'core_capture_success' ? 1 : 0,
    exportOrCopySuccessCount: eventType === 'export_or_copy_success' ? 1 : 0,
    syncSuccessCount: eventType === 'sync_success' ? 1 : 0,
    highValueClickCount: eventType === 'high_value_click' ? 1 : 0,
    failureSignalCount: eventType === 'failure_signal' ? 1 : 0,
  };

  await db()
    .insert(welfareUsageSummary)
    .values({
      id: getUuid(),
      credentialId: result.data.credential.id,
      credentialCode: result.data.credential.code,
      userId: result.data.user?.id || null,
      clientUuid,
      ...insertCounts,
      failureStreak: eventType === 'failure_signal' ? 1 : 0,
      totalEventCount: 1,
      latestEventType: eventType,
      metadataJson:
        body.metadata && typeof body.metadata === 'object'
          ? JSON.stringify(body.metadata)
          : null,
      firstSeenAt: now,
      lastEventAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: welfareUsageSummary.credentialCode,
      set: {
        [eventColumn.name]: sql`${eventColumn} + ${increment}`,
        failureStreak:
          eventType === 'failure_signal'
            ? sql`${welfareUsageSummary.failureStreak} + 1`
            : 0,
        totalEventCount: sql`${welfareUsageSummary.totalEventCount} + 1`,
        latestEventType: eventType,
        metadataJson:
          body.metadata && typeof body.metadata === 'object'
            ? JSON.stringify(body.metadata)
            : null,
        lastEventAt: now,
        updatedAt: now,
      },
    });

  return pluginOk(
    await readWelfareUsage(result.data.credential.code),
    'welfare usage event recorded'
  );
}

export const Route = createFileRoute('/api/welfare/usage')({
  server: { handlers: { GET, POST } },
});
