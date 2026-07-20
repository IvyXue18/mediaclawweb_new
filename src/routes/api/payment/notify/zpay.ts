import { createFileRoute } from '@tanstack/react-router';

import {
  PaymentEventType,
  PaymentStatus,
  type PaymentEvent,
} from '@/core/payment/types';
import { readZpayParams, ZpayProvider } from '@/core/payment/zpay';
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
    let event: PaymentEvent;
    try {
      event = await provider.getPaymentEvent({ req: request });
    } catch (error: any) {
      // Some ZPay channels have been observed to send a paid notification
      // whose signature cannot be reproduced from the decoded callback
      // parameters. Never trust that notification directly: actively query
      // ZPay with our merchant credentials and only accept its paid result.
      if (error?.message !== 'Invalid Zpay signature') throw error;

      const params = await readZpayParams(request);
      const orderNo = String(params.out_trade_no || '').trim();
      const tradeNo = String(params.trade_no || '').trim();
      if (!orderNo || !tradeNo) throw error;

      const verifiedSession = await provider.getPaymentSessionByTradeNo({
        tradeNo,
        orderNo,
      });
      const verifiedOrderNo = String(
        verifiedSession.paymentResult?.out_trade_no ||
          verifiedSession.metadata?.order_no ||
          ''
      ).trim();
      if (
        verifiedSession.paymentStatus !== PaymentStatus.SUCCESS ||
        verifiedOrderNo !== orderNo
      ) {
        throw error;
      }

      console.warn(
        '[Zpay Webhook] callback signature mismatch; accepted after active order verification',
        { orderNo }
      );
      event = {
        eventType: PaymentEventType.CHECKOUT_SUCCESS,
        eventResult: verifiedSession.paymentResult,
        paymentSession: verifiedSession,
      };
    }
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
