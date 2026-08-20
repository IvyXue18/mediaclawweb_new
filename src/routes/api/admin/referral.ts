import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { hasPermission } from '@/modules/rbac/service';
import {
  listReferralCommissions,
  listReferralWithdrawals,
  reviewWithdrawal,
} from '@/modules/referral/service';
import { respErr, respOk, respPage } from '@/lib/resp';

async function requireAdmin(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error('Unauthorized');
  const isAdmin = await hasPermission(session.user.id, 'admin.*');
  if (!isAdmin) throw new Error('Forbidden');
  return session.user;
}

async function GET({ request }: { request: Request }) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') || '50'))
    );
    const kind = searchParams.get('kind') || 'commissions';
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const result =
      kind === 'withdrawals'
        ? await listReferralWithdrawals({ page, pageSize, status, search })
        : await listReferralCommissions({ page, pageSize, status, search });
    return respPage(result.items, result.total);
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
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
    return respErr(error.message || 'Review withdrawal failed');
  }
}

export const Route = createFileRoute('/api/admin/referral')({
  server: {
    handlers: { GET, PATCH },
  },
});
