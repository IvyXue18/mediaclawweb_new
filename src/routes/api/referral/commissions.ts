import { createFileRoute } from '@tanstack/react-router';

import { getReferralOverview } from '@/modules/referral/service';
import { respData, respErr } from '@/lib/resp';

import { requireUser } from '../user/-compat';

async function GET({ request }: { request: Request }) {
  try {
    const user = await requireUser(request);
    const overview = await getReferralOverview(user.id);
    return respData(overview.commissions);
  } catch (error: any) {
    return respErr(error.message || 'Get referral commissions failed');
  }
}

export const Route = createFileRoute('/api/referral/commissions')({
  server: {
    handlers: { GET },
  },
});
