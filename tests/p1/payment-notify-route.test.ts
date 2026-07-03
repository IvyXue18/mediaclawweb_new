import { POST } from '@/app/api/payment/notify/[provider]/route';
import {
  PaymentEventType,
  SubscriptionCycleType,
} from '@/extensions/payment/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPaymentEvent: vi.fn(),
  findOrderByOrderNo: vi.fn(),
  findOrderByTransactionId: vi.fn(),
  findSubscriptionByProviderSubscriptionId: vi.fn(),
  handleCheckoutSuccess: vi.fn(),
  handleSubscriptionRenewal: vi.fn(),
  handleSubscriptionUpdated: vi.fn(),
  handleSubscriptionCanceled: vi.fn(),
  handleRefundCommission: vi.fn(),
}));

vi.mock('@/shared/services/payment', () => ({
  getPaymentService: async () => ({
    getProvider: () => ({
      name: 'stripe',
      getPaymentEvent: mocks.getPaymentEvent,
    }),
  }),
  handleCheckoutSuccess: (...args: any[]) =>
    mocks.handleCheckoutSuccess(...args),
  handleSubscriptionRenewal: (...args: any[]) =>
    mocks.handleSubscriptionRenewal(...args),
  handleSubscriptionUpdated: (...args: any[]) =>
    mocks.handleSubscriptionUpdated(...args),
  handleSubscriptionCanceled: (...args: any[]) =>
    mocks.handleSubscriptionCanceled(...args),
}));

vi.mock('@/shared/models/order', () => ({
  findOrderByOrderNo: (...args: any[]) => mocks.findOrderByOrderNo(...args),
  findOrderByTransactionId: (...args: any[]) =>
    mocks.findOrderByTransactionId(...args),
}));

vi.mock('@/shared/models/subscription', () => ({
  findSubscriptionByProviderSubscriptionId: (...args: any[]) =>
    mocks.findSubscriptionByProviderSubscriptionId(...args),
}));

vi.mock('@/shared/services/referral', () => ({
  handleRefundCommission: (...args: any[]) =>
    mocks.handleRefundCommission(...args),
}));

function callNotify(provider = 'stripe') {
  return POST(
    new Request(`https://mediaclaw.example/api/payment/notify/${provider}`),
    {
      params: Promise.resolve({ provider }),
    }
  );
}

describe('/api/payment/notify/[provider] contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findOrderByOrderNo.mockResolvedValue({
      orderNo: 'ORDER-1001',
      status: 'created',
    });
    mocks.findSubscriptionByProviderSubscriptionId.mockResolvedValue({
      subscriptionNo: 'SUB-1001',
      subscriptionId: 'sub-provider-1',
      userId: 'user-1',
    });
    mocks.findOrderByTransactionId.mockResolvedValue(null);
    mocks.handleCheckoutSuccess.mockResolvedValue(undefined);
    mocks.handleSubscriptionRenewal.mockResolvedValue(undefined);
    mocks.handleSubscriptionUpdated.mockResolvedValue(undefined);
    mocks.handleSubscriptionCanceled.mockResolvedValue(undefined);
    mocks.handleRefundCommission.mockResolvedValue(undefined);
  });

  it('handles checkout success events through handleCheckoutSuccess', async () => {
    const session = {
      provider: 'stripe',
      metadata: {
        order_no: 'ORDER-1001',
      },
    };
    mocks.getPaymentEvent.mockResolvedValue({
      eventType: PaymentEventType.CHECKOUT_SUCCESS,
      eventResult: {},
      paymentSession: session,
    });

    const response = await callNotify('stripe');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      message: 'success',
    });
    expect(mocks.findOrderByOrderNo).toHaveBeenCalledWith('ORDER-1001');
    expect(mocks.handleCheckoutSuccess).toHaveBeenCalledWith({
      order: expect.objectContaining({ orderNo: 'ORDER-1001' }),
      session,
    });
  });

  it('returns raw success for zpay notifications', async () => {
    mocks.getPaymentEvent.mockResolvedValue({
      eventType: PaymentEventType.PAYMENT_REFUNDED,
      eventResult: {},
      paymentSession: {
        provider: 'zpay',
        metadata: {
          order_no: 'ORDER-REFUND-1',
        },
      },
    });

    const response = await callNotify('zpay');

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('success');
    expect(mocks.handleRefundCommission).toHaveBeenCalledWith('ORDER-REFUND-1');
  });

  it('skips duplicate subscription renewal transactions', async () => {
    mocks.findOrderByTransactionId.mockResolvedValue({
      orderNo: 'ORDER-EXISTING',
    });
    mocks.getPaymentEvent.mockResolvedValue({
      eventType: PaymentEventType.PAYMENT_SUCCESS,
      eventResult: {},
      paymentSession: {
        provider: 'stripe',
        subscriptionId: 'sub-provider-1',
        subscriptionInfo: {
          subscriptionId: 'sub-provider-1',
          currentPeriodStart: new Date('2026-06-01T00:00:00.000Z'),
          currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z'),
        },
        paymentInfo: {
          transactionId: 'txn-duplicate',
          subscriptionCycleType: SubscriptionCycleType.RENEWAL,
        },
      },
    });

    const response = await callNotify('stripe');

    expect(response.status).toBe(200);
    expect(mocks.findOrderByTransactionId).toHaveBeenCalledWith({
      transactionId: 'txn-duplicate',
      paymentProvider: 'stripe',
    });
    expect(mocks.handleSubscriptionRenewal).not.toHaveBeenCalled();
  });

  it('routes new subscription renewal events to handleSubscriptionRenewal', async () => {
    mocks.getPaymentEvent.mockResolvedValue({
      eventType: PaymentEventType.PAYMENT_SUCCESS,
      eventResult: {},
      paymentSession: {
        provider: 'stripe',
        subscriptionId: 'sub-provider-1',
        subscriptionInfo: {
          subscriptionId: 'sub-provider-1',
          currentPeriodStart: new Date('2026-06-01T00:00:00.000Z'),
          currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z'),
        },
        paymentInfo: {
          transactionId: 'txn-renew-1',
          subscriptionCycleType: SubscriptionCycleType.RENEWAL,
        },
      },
    });

    const response = await callNotify('stripe');

    expect(response.status).toBe(200);
    expect(mocks.handleSubscriptionRenewal).toHaveBeenCalledWith({
      subscription: expect.objectContaining({
        subscriptionId: 'sub-provider-1',
      }),
      session: expect.objectContaining({
        subscriptionId: 'sub-provider-1',
      }),
    });
  });
});
