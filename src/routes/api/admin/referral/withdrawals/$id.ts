import { createFileRoute } from '@tanstack/react-router';

import { reviewWithdrawal } from '@/modules/referral/service';
import { respErr, respOk } from '@/lib/resp';

import { requireAdmin } from '../../-compat';

async function PATCH({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    const user = await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    if (body.status !== 'paid' && body.status !== 'rejected') {
      return respErr('Unsupported review status');
    }

    await reviewWithdrawal({
      id: params.id,
      reviewerUserId: user.id,
      status: body.status,
      reason: body.reason,
    });
    return respOk();
  } catch (error: any) {
    return respErr(error.message || 'Review referral withdrawal failed');
  }
}

export const Route = createFileRoute('/api/admin/referral/withdrawals/$id')({
  server: {
    handlers: { PATCH },
  },
});
