import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  createWithdrawalRequest,
  getReferralOverview,
} from '@/modules/referral/service';
import { respData, respErr } from '@/lib/resp';

async function requireUser(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error('Unauthorized');
  return session.user;
}

async function GET({ request }: { request: Request }) {
  try {
    const user = await requireUser(request);
    return respData(await getReferralOverview(user.id));
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

export async function POST({ request }: { request: Request }) {
  try {
    const user = await requireUser(request);
    const body = await request.json().catch(() => ({}));
    const created = await createWithdrawalRequest({
      userId: user.id,
      amount: body.amount == null ? undefined : Number(body.amount),
      currency: body.currency,
      accountInfo: body.accountInfo,
      contactSnapshot: body.contactSnapshot || body.contact_snapshot,
    });
    return respData(created);
  } catch (error: any) {
    return respErr(error.message || 'Create withdrawal failed');
  }
}

export const Route = createFileRoute('/api/referral')({
  server: {
    handlers: { GET, POST },
  },
});
