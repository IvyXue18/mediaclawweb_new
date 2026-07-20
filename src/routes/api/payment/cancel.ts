import { createFileRoute } from '@tanstack/react-router';

import { cancelPendingCheckout } from '@/modules/payment/service';
import { respData, respErr } from '@/lib/resp';

import { requireUser } from '../user/-compat';

async function POST({ request }: { request: Request }) {
  try {
    const user = await requireUser(request);
    const body = await request.json().catch(() => ({}));
    const orderNo = String(body?.order_no || body?.orderNo || '').trim();
    if (!orderNo) return respErr('order_no is required');

    const result = await cancelPendingCheckout({
      userId: user.id,
      orderNo,
      reason: 'user_canceled',
    });
    return respData(result);
  } catch (error: any) {
    return respErr(error?.message || 'failed to cancel payment');
  }
}

export const Route = createFileRoute('/api/payment/cancel')({
  server: {
    handlers: { POST },
  },
});
