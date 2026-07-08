import { createFileRoute } from '@tanstack/react-router';

import {
  findOrderByOrderNo,
  repairOrderPayment,
} from '@/modules/payment/service';
import { respData, respErr } from '@/lib/resp';

import { requireUser } from '../user/-compat';

async function GET({ request }: { request: Request }) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNo = searchParams.get('order_no') || searchParams.get('orderNo');
    const shouldSync =
      searchParams.get('sync') === '1' || searchParams.get('sync') === 'true';

    if (!orderNo) return respErr('order_no is required');

    const user = await requireUser(request);
    let order = await findOrderByOrderNo(orderNo);
    if (!order || order.userId !== user.id) {
      return respErr('order not found');
    }

    let repaired = false;
    let paymentStatus: string | null = null;

    const shouldRetryCredentialSync =
      order.status === 'paid' &&
      order.credentialAction &&
      order.credentialAction !== 'none' &&
      order.credentialSyncStatus !== 'done';

    if (
      shouldSync &&
      (order.status !== 'paid' ||
        shouldRetryCredentialSync ||
        (order.status === 'paid' &&
          order.credentialAction &&
          order.credentialAction !== 'none'))
    ) {
      const result = await repairOrderPayment(order);
      repaired = result.repaired;
      paymentStatus = result.paymentStatus || null;
      order = await findOrderByOrderNo(orderNo);
      if (!order || order.userId !== user.id) {
        return respErr('order not found');
      }
    }

    return respData({
      orderNo: order.orderNo,
      status: order.status,
      credentialAction: order.credentialAction,
      credentialSyncStatus: order.credentialSyncStatus,
      credentialSyncError: order.credentialSyncError,
      credentialCode: order.credentialCode,
      productId: order.productId,
      productName: order.productName,
      repaired,
      paymentStatus,
    });
  } catch (error: any) {
    return respErr(error?.message || 'failed to get payment status');
  }
}

export const Route = createFileRoute('/api/payment/status')({
  server: {
    handlers: { GET },
  },
});
