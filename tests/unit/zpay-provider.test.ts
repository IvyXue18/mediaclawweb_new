import { afterEach, describe, expect, it, vi } from 'vitest';

import { PaymentStatus } from '@/core/payment/types';
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
});
