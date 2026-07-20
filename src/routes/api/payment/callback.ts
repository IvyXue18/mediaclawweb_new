import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import {
  findOrderByOrderNo,
  handlePaymentCallback,
} from '@/modules/payment/service';

/**
 * GET /api/payment/callback?order_no=xxx&redirect=xxx
 *
 * After payment (e.g. Alipay return_url), this endpoint:
 * 1. Queries the payment provider for the latest order status
 * 2. Updates the order in DB if paid
 * 3. Redirects to the final destination (same-origin only)
 */
function resolveSameOriginRedirect(
  input: string | null,
  fallbackUrl: string
): string {
  if (!input) return fallbackUrl;
  try {
    const appUrl = new URL(envConfigs.app_url || 'http://localhost:3000');
    const target = new URL(input, appUrl);
    if (target.origin !== appUrl.origin) return fallbackUrl;
    return target.toString();
  } catch {
    return fallbackUrl;
  }
}

function withOrderStateParams({
  redirect,
  order,
  orderNo,
  callbackError,
}: {
  redirect: string;
  order?: Awaited<ReturnType<typeof findOrderByOrderNo>>;
  orderNo?: string | null;
  callbackError?: boolean;
}) {
  const url = new URL(redirect);
  url.searchParams.set('payment_callback', '1');

  if (orderNo) {
    url.searchParams.set('order_no', orderNo);
  }

  if (callbackError) {
    url.searchParams.set('payment_callback_error', '1');
  }

  if (order) {
    url.searchParams.set('payment_status', order.status || '');
    url.searchParams.set('payment_provider', order.paymentProvider || '');
    url.searchParams.set('credential_action', order.credentialAction || 'none');
    if (order.credentialSyncStatus) {
      url.searchParams.set(
        'credential_sync_status',
        order.credentialSyncStatus
      );
    }
  }

  return url.toString();
}

export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  // ZPay's return notification supplies out_trade_no itself and documents
  // that return_url query parameters are not preserved. Keep order_no for
  // other providers and older checkout URLs.
  const orderNo =
    url.searchParams.get('order_no') || url.searchParams.get('out_trade_no');
  const redirect = url.searchParams.get('redirect');
  const fallback = `${envConfigs.app_url}/settings/payments`;
  let callbackError = false;

  try {
    if (orderNo) {
      await handlePaymentCallback(orderNo);
    }
  } catch (error: any) {
    callbackError = true;
    console.error('payment callback error:', error);
  }

  const resolvedRedirect = resolveSameOriginRedirect(redirect, fallback);
  const order = orderNo
    ? await findOrderByOrderNo(orderNo).catch(() => null)
    : null;

  return new Response(null, {
    status: 302,
    headers: {
      Location: withOrderStateParams({
        redirect: resolvedRedirect,
        order,
        orderNo,
        callbackError,
      }),
    },
  });
}

export const Route = createFileRoute('/api/payment/callback')({
  server: {
    handlers: { GET },
  },
});
