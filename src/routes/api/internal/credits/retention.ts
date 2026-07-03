import { createFileRoute } from '@tanstack/react-router';
import { and, count, lt } from 'drizzle-orm';

import { db } from '@/core/db';
import { envConfigs } from '@/config';
import { credit } from '@/config/db/schema';
import { getAllConfigs } from '@/modules/config/service';

function getRetentionDays(configs: Record<string, string>) {
  const value = Number(configs.credit_detail_retention_days || 90);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 90;
}

async function POST({ request }: { request: Request }) {
  try {
    const configs = await getAllConfigs();
    const token = request.headers.get('x-internal-token') || '';
    const expectedToken =
      configs.credit_cron_token ||
      envConfigs.credit_cron_token ||
      envConfigs.auth_secret;

    if (!expectedToken || token !== expectedToken) {
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (configs.credit_cleanup_enabled !== 'true') {
      return Response.json({
        ok: true,
        skipped: true,
        message: 'Credit cleanup task is disabled',
      });
    }

    const body = await request.json().catch(() => ({}));
    const retentionDays = getRetentionDays(configs);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const dryRun =
      typeof body?.dryRun === 'boolean'
        ? body.dryRun
        : configs.credit_cleanup_dry_run !== 'false';

    const [result] = await db()
      .select({ count: count() })
      .from(credit)
      .where(and(lt(credit.createdAt, cutoff)));

    return Response.json({
      ok: true,
      data: {
        retentionDays,
        cutoff: cutoff.toISOString(),
        dryRun,
        matchedRows: result?.count || 0,
        rolledUpRows: 0,
        deletedRows: 0,
      },
    });
  } catch (error: any) {
    return Response.json(
      { ok: false, message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const Route = createFileRoute('/api/internal/credits/retention')({
  server: { handlers: { POST } },
});
