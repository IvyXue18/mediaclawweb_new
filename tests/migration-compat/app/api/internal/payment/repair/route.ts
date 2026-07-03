import { findOrderByOrderNo } from '@/shared/models/order';
import { repairOrderPayment } from '@/shared/services/payment';

import { envConfigs } from '@/config';

export async function POST(req: Request) {
  try {
    const token = req.headers.get('x-internal-token') || '';
    const expectedToken = envConfigs.auth_secret;

    if (!expectedToken || token !== expectedToken) {
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const orderNo = String(body?.orderNo || body?.order_no || '').trim();
    if (!orderNo) {
      return Response.json(
        { ok: false, message: 'orderNo is required' },
        { status: 400 }
      );
    }

    const order = await findOrderByOrderNo(orderNo);
    if (!order) {
      return Response.json(
        { ok: false, message: `order not found: ${orderNo}` },
        { status: 404 }
      );
    }

    const result = await repairOrderPayment(order);

    if (!result.repaired) {
      return Response.json(
        {
          ok: false,
          message: `payment is not successful yet: ${
            result.paymentStatus || 'unknown'
          }`,
          data: {
            orderNo,
            paymentStatus: result.paymentStatus,
          },
        },
        { status: 409 }
      );
    }

    return Response.json({
      ok: true,
      message: 'Payment order repaired',
      data: {
        orderNo,
        paymentStatus: result.paymentStatus,
      },
    });
  } catch (error: any) {
    return Response.json(
      { ok: false, message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
