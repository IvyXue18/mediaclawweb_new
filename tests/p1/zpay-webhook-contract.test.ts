import crypto from 'node:crypto';
import { PaymentEventType, PaymentStatus } from '@/extensions/payment/types';
import { ZpayProvider } from '@/extensions/payment/zpay';
import { describe, expect, it } from 'vitest';

function signZpayParams(params: Record<string, string>, pkey: string) {
  const payload = Object.entries(params)
    .filter(
      ([key, value]) =>
        key !== 'sign' && key !== 'sign_type' && value !== '' && value != null
    )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return crypto
    .createHash('md5')
    .update(`${payload}${pkey}`)
    .digest('hex')
    .toLowerCase();
}

function buildSignedZpayRequest({
  method = 'GET',
  params,
  pkey = 'zpay-secret',
}: {
  method?: 'GET' | 'POST';
  params: Record<string, string>;
  pkey?: string;
}) {
  const signedParams: Record<string, string> = {
    ...params,
    sign_type: 'MD5',
  };
  signedParams.sign = signZpayParams(signedParams, pkey);

  if (method === 'POST') {
    return new Request('http://localhost/api/payment/notify/zpay', {
      method,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(signedParams),
    });
  }

  const url = new URL('http://localhost/api/payment/notify/zpay');
  Object.entries(signedParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new Request(url);
}

describe('Zpay webhook contract', () => {
  it('parses a signed TRADE_SUCCESS notification into a checkout success event', async () => {
    const provider = new ZpayProvider({
      pid: '1001',
      pkey: 'zpay-secret',
    });

    const event = await provider.getPaymentEvent({
      req: buildSignedZpayRequest({
        params: {
          pid: '1001',
          trade_no: 'zpay-trade-1',
          out_trade_no: 'ORDER-1001',
          type: 'alipay',
          name: 'MediaClaw Pro',
          money: '99.90',
          trade_status: 'TRADE_SUCCESS',
        },
      }),
    });

    expect(event.eventType).toBe(PaymentEventType.CHECKOUT_SUCCESS);
    expect(event.paymentSession).toMatchObject({
      provider: 'zpay',
      paymentStatus: PaymentStatus.SUCCESS,
      paymentInfo: {
        paymentAmount: 9990,
        paymentCurrency: 'CNY',
        transactionId: 'zpay-trade-1',
      },
      metadata: {
        order_no: 'ORDER-1001',
      },
    });
  });

  it('supports POST form notifications with the same signature contract', async () => {
    const provider = new ZpayProvider({
      pid: '1001',
      pkey: 'zpay-secret',
    });

    const event = await provider.getPaymentEvent({
      req: buildSignedZpayRequest({
        method: 'POST',
        params: {
          pid: '1001',
          trade_no: 'zpay-trade-2',
          out_trade_no: 'ORDER-1002',
          type: 'wxpay',
          name: 'MediaClaw Credits',
          money: '29.00',
          trade_status: 'TRADE_SUCCESS',
        },
      }),
    });

    expect(event.eventType).toBe(PaymentEventType.CHECKOUT_SUCCESS);
    expect(event.paymentSession).toBeDefined();
    expect(event.paymentSession?.paymentInfo?.paymentAmount).toBe(2900);
    expect(event.paymentSession?.metadata?.order_no).toBe('ORDER-1002');
  });

  it('rejects tampered notification signatures', async () => {
    const provider = new ZpayProvider({
      pid: '1001',
      pkey: 'zpay-secret',
    });
    const url = new URL('http://localhost/api/payment/notify/zpay');
    url.searchParams.set('pid', '1001');
    url.searchParams.set('trade_no', 'zpay-trade-3');
    url.searchParams.set('out_trade_no', 'ORDER-1003');
    url.searchParams.set('money', '19.00');
    url.searchParams.set('trade_status', 'TRADE_SUCCESS');
    url.searchParams.set('sign_type', 'MD5');
    url.searchParams.set('sign', 'invalid-signature');

    await expect(
      provider.getPaymentEvent({ req: new Request(url) })
    ).rejects.toThrow('Invalid Zpay signature');
  });
});
