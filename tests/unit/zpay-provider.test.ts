import { afterEach, describe, expect, it, vi } from 'vitest';

import { PaymentEventType, PaymentStatus } from '@/core/payment/types';
import { ZpayProvider } from '@/core/payment/zpay';

describe('ZpayProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('passes mapi pay and qr fields through the local checkout page', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1,
        trade_no: 'ZPAY-TRADE-1',
        payurl: 'https://zpayz.cn/pay/ORDER-ZPAY-1',
        qrcode: 'alipay://qr/ORDER-ZPAY-1',
        img: 'https://zpayz.cn/qr/ORDER-ZPAY-1.png',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new ZpayProvider({
      pid: '1001',
      pkey: 'secret',
      appUrl: 'https://mediaclaw.example',
    });
    const session = await provider.createPayment({
      order: {
        orderNo: 'ORDER-ZPAY-1',
        description: 'MediaClaw Pro',
        price: { amount: 28800, currency: 'cny' },
        successUrl:
          'https://mediaclaw.example/api/payment/callback?order_no=ORDER-ZPAY-1',
        cancelUrl: 'https://mediaclaw.example/pricing',
        metadata: {
          clientip: '203.0.113.10',
          device: 'mobile',
        },
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://zpayz.cn/mapi.php',
      expect.objectContaining({
        method: 'POST',
      })
    );

    const checkoutUrl = new URL(session.checkoutInfo.checkoutUrl);
    expect(checkoutUrl.origin).toBe('https://mediaclaw.example');
    expect(checkoutUrl.pathname).toBe('/checkout/zpay');
    expect(checkoutUrl.searchParams.get('pay_url')).toBe(
      'https://zpayz.cn/pay/ORDER-ZPAY-1'
    );
    expect(checkoutUrl.searchParams.get('qrcode')).toBe(
      'alipay://qr/ORDER-ZPAY-1'
    );
    expect(checkoutUrl.searchParams.get('img')).toBe(
      'https://zpayz.cn/qr/ORDER-ZPAY-1.png'
    );
    expect(session.metadata.trade_no).toBe('ZPAY-TRADE-1');
  });

  it('falls back to submit.php when mapi does not return a checkout payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: -1,
          msg: 'temporary unavailable',
        }),
      })
    );

    const provider = new ZpayProvider({
      pid: '1001',
      pkey: 'secret',
      appUrl: 'https://mediaclaw.example',
    });
    const session = await provider.createPayment({
      order: {
        orderNo: 'ORDER-ZPAY-FALLBACK',
        description: 'MediaClaw Pro',
        price: { amount: 28800, currency: 'cny' },
      },
    });

    const checkoutUrl = new URL(session.checkoutInfo.checkoutUrl);
    expect(checkoutUrl.searchParams.get('submit_url')).toContain(
      'https://zpayz.cn/submit.php'
    );
    expect(checkoutUrl.searchParams.get('pay_url')).toBeNull();
    expect(checkoutUrl.searchParams.get('img')).toBeNull();
  });

  it('maps queried paid orders to a successful payment session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: 1,
          trade_no: 'ZPAY-TRADE-PAID',
          out_trade_no: 'ORDER-ZPAY-PAID',
          money: '288.00',
          status: 1,
          buyer: 'buyer@example.com',
          endtime: '2026-07-07T12:00:00.000Z',
        }),
      })
    );

    const provider = new ZpayProvider({
      pid: '1001',
      pkey: 'secret',
    });
    const session = await provider.getPaymentSession({
      sessionId: 'ORDER-ZPAY-PAID',
    });

    expect(session.paymentStatus).toBe(PaymentStatus.SUCCESS);
    expect(session.paymentInfo).toMatchObject({
      paymentAmount: 28800,
      paymentCurrency: 'CNY',
      transactionId: 'ZPAY-TRADE-PAID',
    });
    expect(session.metadata).toMatchObject({
      order_no: 'ORDER-ZPAY-PAID',
      buyer: 'buyer@example.com',
    });
  });

  it('can query a paid order by the ZPay platform trade number', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1,
        trade_no: 'ZPAY-TRADE-PAID',
        out_trade_no: 'ORDER-ZPAY-PAID',
        money: '9.00',
        status: 1,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new ZpayProvider({
      pid: '1001',
      pkey: 'secret',
    });
    const session = await provider.getPaymentSessionByTradeNo({
      tradeNo: 'ZPAY-TRADE-PAID',
      orderNo: 'ORDER-ZPAY-PAID',
    });

    const queryUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(queryUrl.searchParams.get('trade_no')).toBe('ZPAY-TRADE-PAID');
    expect(queryUrl.searchParams.get('out_trade_no')).toBeNull();
    expect(session.paymentStatus).toBe(PaymentStatus.SUCCESS);
    expect(session.metadata.order_no).toBe('ORDER-ZPAY-PAID');
  });

  it('does not trust a paid trade lookup that omits the bound merchant order number', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: 1,
          trade_no: 'ZPAY-TRADE-PAID',
          money: '9.00',
          status: 1,
        }),
      })
    );

    const provider = new ZpayProvider({
      pid: '1001',
      pkey: 'secret',
    });
    const session = await provider.getPaymentSessionByTradeNo({
      tradeNo: 'ZPAY-TRADE-PAID',
      orderNo: 'ORDER-ZPAY-PAID',
    });

    expect(session.paymentStatus).toBe(PaymentStatus.PROCESSING);
  });

  it('accepts a keyed callback signature when ZPay normalizes a literal plus to a space', async () => {
    const provider = new ZpayProvider({
      pid: '1001',
      pkey: 'secret',
    });
    const params = {
      pid: '1001',
      trade_no: '2026071923001491441423118761',
      out_trade_no: 'ORDER-ZPAY-PLUS',
      type: 'alipay',
      name: '5 天会员 + 50 积分',
      money: '9.00',
      trade_status: 'TRADE_SUCCESS',
      sign_type: 'MD5',
    };
    const sign = provider.sign({
      ...params,
      name: params.name.replace(/\+/g, ' '),
    });
    const url = new URL('https://mediaclaw.example/api/payment/notify/zpay');
    Object.entries({ ...params, sign }).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const event = await provider.getPaymentEvent({ req: new Request(url) });

    expect(event.eventType).toBe(PaymentEventType.CHECKOUT_SUCCESS);
    expect(event.paymentSession?.paymentStatus).toBe(PaymentStatus.SUCCESS);
    expect(event.paymentSession?.metadata?.order_no).toBe('ORDER-ZPAY-PLUS');
  });
});
