import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  findPartnerByBusinessId,
  findPartnerByUserId,
  getPartnerCredentials,
  isPartnerCurrentlyActive,
  partnerBusinessId,
} from '@/modules/partners/service';
import { hasPermission } from '@/modules/rbac/service';
import { respErr } from '@/lib/resp';

function csvEscape(value: unknown) {
  const text =
    value instanceof Date
      ? value.toISOString()
      : value === null || value === undefined
        ? ''
        : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const { searchParams } = new URL(request.url);
    const requestedPartnerId = searchParams.get('partnerId');

    const isAdmin = await hasPermission(session.user.id, 'admin.*');
    const row = requestedPartnerId
      ? await findPartnerByBusinessId(requestedPartnerId)
      : await findPartnerByUserId(session.user.id);
    if (!row) return respErr('Partner not found');

    if (!isAdmin && row.ownerUserId !== session.user.id) {
      return respErr('Forbidden');
    }
    if (!isPartnerCurrentlyActive(row) && !isAdmin) {
      return respErr('partner access denied');
    }

    const status = searchParams.get('status') || 'all';
    const credentials = await getPartnerCredentials({
      partnerId: partnerBusinessId(row),
      status,
      page: 1,
      limit: 10000,
    });
    const header = [
      'code',
      'status',
      'activationStatus',
      'planCode',
      'partnerId',
      'variantId',
      'sourceOrderNo',
      'assignmentNote',
      'activatedAt',
      'expiresAt',
      'createdAt',
    ];
    const rows = credentials.map((item) =>
      [
        item.code,
        item.status,
        item.activationStatus,
        item.planCode,
        item.partnerId,
        item.variantId,
        item.sourceOrderNo,
        item.assignmentNote,
        item.activatedAt,
        item.expiresAt,
        item.createdAt,
      ]
        .map(csvEscape)
        .join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="mediaclaw-${row.partnerCode}-credentials.csv"`,
      },
    });
  } catch (error: any) {
    return respErr(error.message || 'Export failed');
  }
}

export const Route = createFileRoute('/api/partner/credentials/export')({
  server: {
    handlers: { GET },
  },
});
