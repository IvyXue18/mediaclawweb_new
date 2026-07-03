import { GET } from '@/routes/api/payment/callback';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findOrderByOrderNo: vi.fn(),
  handlePaymentCallback: vi.fn(),
}));

vi.mock('@/config', () => ({
  envConfigs: {
    app_url: 'https://mediaclaw.example',
  },
}));

vi.mock('@/modules/payment/service', () => ({
  findOrderByOrderNo: (...args: any[]) => mocks.findOrderByOrderNo(...args),
  handlePaymentCallback: (...args: any[]) =>
    mocks.handlePaymentCallback(...args),
}));

function request(url: string) {
  return new Request(url);
}

describe('/api/payment/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.handlePaymentCallback.mockResolvedValue(undefined);
    mocks.findOrderByOrderNo.mockResolvedValue({
      orderNo: 'ORDER-CALLBACK-1',
      status: 'paid',
      paymentProvider: 'zpay',
      credentialAction: 'issue',
      credentialSyncStatus: 'done',
      credentialCode: 'ACT-SHOULD-NOT-LEAK',
    });
  });

  it('syncs the order and appends non-sensitive payment state to the final redirect', async () => {
    const redirect = encodeURIComponent(
      'https://mediaclaw.example/settings/payments?tab=all'
    );
    const response = await GET({
      request: request(
        `https://mediaclaw.example/api/payment/callback?order_no=ORDER-CALLBACK-1&redirect=${redirect}`
      ),
    });

    expect(response.status).toBe(302);
    expect(mocks.handlePaymentCallback).toHaveBeenCalledWith(
      'ORDER-CALLBACK-1'
    );
    expect(mocks.findOrderByOrderNo).toHaveBeenCalledWith('ORDER-CALLBACK-1');

    const location = response.headers.get('Location') || '';
    const url = new URL(location);
    expect(url.origin).toBe('https://mediaclaw.example');
    expect(url.pathname).toBe('/settings/payments');
    expect(url.searchParams.get('tab')).toBe('all');
    expect(url.searchParams.get('payment_callback')).toBe('1');
    expect(url.searchParams.get('order_no')).toBe('ORDER-CALLBACK-1');
    expect(url.searchParams.get('payment_status')).toBe('paid');
    expect(url.searchParams.get('payment_provider')).toBe('zpay');
    expect(url.searchParams.get('credential_action')).toBe('issue');
    expect(url.searchParams.get('credential_sync_status')).toBe('done');
    expect(location).not.toContain('ACT-SHOULD-NOT-LEAK');
  });

  it('falls back to a same-origin billing page for unsafe redirect targets', async () => {
    const redirect = encodeURIComponent('https://evil.example/payments');
    const response = await GET({
      request: request(
        `https://mediaclaw.example/api/payment/callback?order_no=ORDER-CALLBACK-1&redirect=${redirect}`
      ),
    });

    const location = response.headers.get('Location') || '';
    const url = new URL(location);
    expect(url.origin).toBe('https://mediaclaw.example');
    expect(url.pathname).toBe('/settings/billing');
    expect(url.searchParams.get('order_no')).toBe('ORDER-CALLBACK-1');
  });

  it('marks callback refresh errors without blocking the user redirect', async () => {
    mocks.handlePaymentCallback.mockRejectedValueOnce(
      new Error('provider unavailable')
    );

    const response = await GET({
      request: request(
        'https://mediaclaw.example/api/payment/callback?order_no=ORDER-CALLBACK-1&redirect=/settings/payments'
      ),
    });

    expect(response.status).toBe(302);
    const location = response.headers.get('Location') || '';
    const url = new URL(location);
    expect(url.pathname).toBe('/settings/payments');
    expect(url.searchParams.get('payment_callback_error')).toBe('1');
    expect(url.searchParams.get('order_no')).toBe('ORDER-CALLBACK-1');
  });
});
