import { createFileRoute } from '@tanstack/react-router';

import {
  ReferralStatus,
  resolveRiskLog,
  updateReferralStatus,
} from '@/modules/referral/service';

import { requireAdmin } from '../../-compat';

async function POST({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    const adminUser = await requireAdmin(request);
    const body = await request.json();
    const targetUserId = body?.targetUserId;
    const action = body?.action as 'activate' | 'suspend' | 'ban';

    if (!params.id || !targetUserId || !action) {
      return Response.json(
        { ok: false, message: 'Risk id, target user and action are required' },
        { status: 400 }
      );
    }

    const nextStatus =
      action === 'activate'
        ? ReferralStatus.ACTIVE
        : action === 'suspend'
          ? ReferralStatus.SUSPENDED
          : ReferralStatus.BANNED;

    await updateReferralStatus(targetUserId, nextStatus);
    await resolveRiskLog({
      riskLogId: params.id,
      resolvedBy: adminUser.id,
    });

    return Response.json({
      ok: true,
      data: {
        riskLogId: params.id,
        targetUserId,
        status: nextStatus,
      },
    });
  } catch (error: any) {
    const message = error.message || 'Internal server error';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400;
    return Response.json({ ok: false, message }, { status });
  }
}

export const Route = createFileRoute('/api/admin/referral/risks/$id')({
  server: { handlers: { POST } },
});
