import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import {
  findOrderByOrderNo,
  repairOrderPayment,
} from '@/modules/payment/service';

function json(body: unknown, init?: ResponseInit) {
  return Response.json(body, init);
}

async function POST({ request }: { request: Request }) {
  try {
    const token = request.headers.get('x-internal-token') || '';
    const expectedToken =
      envConfigs.license_internal_token || envConfigs.auth_secret;
    if (!expectedToken || token !== expectedToken) {
      return json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const orderNo = String(body.orderNo || body.order_no || '').trim();
    if (!orderNo) {
      return json(
        { ok: false, message: 'orderNo is required' },
        { status: 400 }
      );
    }

    const order = await findOrderByOrderNo(orderNo);
    if (!order) {
      return json(
        { ok: false, message: `order not found: ${orderNo}` },
        { status: 404 }
      );
    }

    const result = await repairOrderPayment(order);
    if (result.paymentStatus !== 'paid') {
      return json(
        {
          ok: false,
          message: `payment is not successful yet: ${result.paymentStatus}`,
          data: {
            orderNo: result.orderNo,
            paymentStatus: result.paymentStatus,
          },
        },
        { status: 409 }
      );
    }

    return json({
      ok: true,
      message: 'Payment order repaired',
      data: {
        orderNo: result.orderNo,
        paymentStatus: result.paymentStatus,
        repaired: result.repaired,
      },
    });
  } catch (error: any) {
    return json(
      { ok: false, message: error?.message || 'payment repair failed' },
      { status: 500 }
    );
  }
}

export const Route = createFileRoute('/api/internal/payment/repair')({
  server: {
    handlers: { POST },
  },
});
