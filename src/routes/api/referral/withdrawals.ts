import { createFileRoute } from '@tanstack/react-router';

import {
  createWithdrawalRequest,
  getReferralOverview,
} from '@/modules/referral/service';
import { respData, respErr } from '@/lib/resp';

import { requireUser } from '../user/-compat';

async function GET({ request }: { request: Request }) {
  try {
    const user = await requireUser(request);
    const overview = await getReferralOverview(user.id);
    return respData(overview.withdrawals);
  } catch (error: any) {
    return respErr(error.message || 'Get referral withdrawals failed');
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
      accountInfo: body.accountInfo || body.account_info,
      contactSnapshot: body.contactSnapshot || body.contact_snapshot,
    });
    return respData(created);
  } catch (error: any) {
    return respErr(error.message || 'Create referral withdrawal failed');
  }
}

export const Route = createFileRoute('/api/referral/withdrawals')({
  server: {
    handlers: { GET, POST },
  },
});
