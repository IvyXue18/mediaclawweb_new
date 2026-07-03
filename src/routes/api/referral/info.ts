import { createFileRoute } from '@tanstack/react-router';

import { getReferralOverview } from '@/modules/referral/service';
import { respData, respErr } from '@/lib/resp';

import { requireUser } from '../user/-compat';

async function GET({ request }: { request: Request }) {
  try {
    const user = await requireUser(request);
    return respData(await getReferralOverview(user.id));
  } catch (error: any) {
    return respErr(error.message || 'Get referral info failed');
  }
}

export const Route = createFileRoute('/api/referral/info')({
  server: {
    handlers: { GET },
  },
});
