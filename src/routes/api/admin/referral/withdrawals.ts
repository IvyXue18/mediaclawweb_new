import { createFileRoute } from '@tanstack/react-router';

import {
  listReferralWithdrawals,
  reviewWithdrawal,
} from '@/modules/referral/service';
import { respErr, respOk, respPage } from '@/lib/resp';

import { getPagination, requireAdmin } from '../-compat';

async function GET({ request }: { request: Request }) {
  try {
    await requireAdmin(request);
    const { page, pageSize, searchParams } = getPagination(request);
    const result = await listReferralWithdrawals({
      page,
      pageSize,
      status: searchParams.get('status'),
      search: searchParams.get('search'),
    });
    return respPage(result.items, result.total);
  } catch (error: any) {
    return respErr(error.message || 'List referral withdrawals failed');
  }
}

async function PATCH({ request }: { request: Request }) {
  try {
    const user = await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    if (!body.id) return respErr('Missing id');
    if (body.status !== 'paid' && body.status !== 'rejected') {
      return respErr('Unsupported review status');
    }

    await reviewWithdrawal({
      id: body.id,
      reviewerUserId: user.id,
      status: body.status,
      reason: body.reason,
    });
    return respOk();
  } catch (error: any) {
    return respErr(error.message || 'Review referral withdrawal failed');
  }
}

export const Route = createFileRoute('/api/admin/referral/withdrawals')({
  server: {
    handlers: { GET, PATCH },
  },
});
