import { createFileRoute } from '@tanstack/react-router';

import { PaymentEventType, PaymentStatus } from '@/core/payment/types';
import { ZpayProvider } from '@/core/payment/zpay';
import { envConfigs } from '@/config';
import { getAllConfigs } from '@/modules/config/service';
import { handleCheckoutSuccess } from '@/modules/payment/service';

async function handleZpayNotify(request: Request) {
  try {
    const configs = await getAllConfigs();
    const pid = configs.zpay_pid || envConfigs.zpay_pid;
    const pkey = configs.zpay_pkey || envConfigs.zpay_pkey;
    if (!pid || !pkey) {
      throw new Error('Zpay provider not configured');
    }

    const provider = new ZpayProvider({
      pid,
      pkey,
      appUrl: configs.app_url || envConfigs.app_url,
    });
    const event = await provider.getPaymentEvent({ req: request });
    const orderNo = event.paymentSession?.metadata?.order_no;
    if (!orderNo) {
      throw new Error('order_no not found in metadata');
    }

    if (event.eventType === PaymentEventType.CHECKOUT_SUCCESS) {
      await handleCheckoutSuccess(
        {
          provider: 'zpay',
          paymentStatus:
            event.paymentSession?.paymentStatus || PaymentStatus.SUCCESS,
          paymentInfo: event.paymentSession?.paymentInfo,
          paymentResult: event.paymentSession?.paymentResult,
          metadata: { order_no: orderNo },
        },
        'zpay'
      );
    }

    return new Response('success', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error: any) {
    console.error('[Zpay Webhook] Error:', error);
    return new Response(`error: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

export const Route = createFileRoute('/api/payment/notify/zpay')({
  server: {
    handlers: {
      GET: ({ request }) => handleZpayNotify(request),
      POST: ({ request }) => handleZpayNotify(request),
    },
  },
});
