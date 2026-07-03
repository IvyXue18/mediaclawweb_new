import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getUserSubscriptionByNo } from '@/modules/subscriptions/service';
import { respData, respErr } from '@/lib/resp';

export async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const { searchParams } = new URL(request.url);
    const subscriptionNo =
      searchParams.get('subscriptionNo') || searchParams.get('subscription_no');
    if (!subscriptionNo) return respErr('subscriptionNo is required');

    const sub = await getUserSubscriptionByNo({
      userId: session.user.id,
      subscriptionNo,
    });

    return respData(sub);
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

export const Route = createFileRoute('/api/user/subscriptions/detail')({
  server: {
    handlers: { GET },
  },
});
