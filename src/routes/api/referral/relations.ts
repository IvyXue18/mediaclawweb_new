import { createFileRoute } from '@tanstack/react-router';

import {
  createReferralRelation,
  getOrCreateReferralAccount,
  listReferralRelations,
} from '@/modules/referral/service';
import { respData, respErr } from '@/lib/resp';

import { requireUser } from '../user/-compat';

export async function GET({ request }: { request: Request }) {
  try {
    const user = await requireUser(request);
    const account = await getOrCreateReferralAccount(user.id);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    const result = await listReferralRelations({
      userId: user.id,
      page,
      pageSize,
    });
    return respData({
      account,
      inviteCode: account.inviteCode,
      items: result.items,
      total: result.total,
    });
  } catch (error: any) {
    return respErr(error.message || 'Get referral relations failed');
  }
}

export async function POST({ request }: { request: Request }) {
  try {
    const user = await requireUser(request);
    const body = await request.json().catch(() => ({}));
    const url = new URL(request.url);
    const relation = await createReferralRelation({
      referralCode:
        body.referralCode ||
        body.referral_code ||
        body.ref ||
        url.searchParams.get('ref') ||
        url.searchParams.get('ref_code'),
      refereeId: user.id,
      refereeEmail: user.email,
    });
    return respData({ relation });
  } catch (error: any) {
    return respErr(error.message || 'Create referral relation failed');
  }
}

export const Route = createFileRoute('/api/referral/relations')({
  server: {
    handlers: { GET, POST },
  },
});
