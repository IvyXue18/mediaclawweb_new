import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PaymentEventType } from '@/core/payment/types';
import { handleWebhook } from '@/modules/payment/service';

const mocks = vi.hoisted(() => ({
  paymentEvent: null as any,
  cancelReferralCommissionForOrder: vi.fn(),
}));

vi.mock('@/config', () => ({
  envConfigs: {
    app_url: 'https://mediaclaw.example',
  },
}));

vi.mock('@/core/payment', () => ({
  PaymentManager: class {
    addProvider() {}
    getDefaultProvider() {
      return { name: 'stripe' };
    }
    async getPaymentEvent() {
      return mocks.paymentEvent;
    }
  },
  AlipayProvider: class {},
  CreemProvider: class {},
  StripeProvider: class {},
  WechatPayProvider: class {},
  ZpayProvider: class {},
}));

vi.mock('@/core/db', () => ({
  db: vi.fn(),
}));

vi.mock('@/modules/config/service', () => ({
  getAllConfigs: vi.fn(async () => ({})),
}));

vi.mock('@/modules/credentials/service', () => ({
  createCredential: vi.fn(),
  getCredentialByCode: vi.fn(),
  rechargeCredential: vi.fn(),
}));

vi.mock('@/modules/credits/service', () => ({
  calculateCreditExpirationTime: vi.fn(() => null),
}));

vi.mock('@/modules/referral/service', () => ({
  cancelReferralCommissionForOrder: (...args: any[]) =>
    mocks.cancelReferralCommissionForOrder(...args),
  processReferralCommissionForPaidOrder: vi.fn(),
}));

vi.mock('@/modules/subscriptions/service', () => ({
  findByProviderSubscriptionId: vi.fn(),
  findBySubscriptionNo: vi.fn(),
  SubscriptionStatus: {
    ACTIVE: 'active',
  },
  updateBySubscriptionNo: vi.fn(),
}));

vi.mock('@/lib/hash', () => ({
  getSnowId: () => 'snow-1',
  getUniSeq: () => 'ORD-1',
  getUuid: () => 'uuid-1',
}));

describe('payment refund referral hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.paymentEvent = {
      eventType: PaymentEventType.PAYMENT_REFUNDED,
      eventResult: {},
      paymentSession: {
        metadata: {
          order_no: 'ORDER-REFUND-1',
        },
      },
    };
    mocks.cancelReferralCommissionForOrder.mockResolvedValue(undefined);
  });

  it('cancels referral commission when a refund event carries order_no', async () => {
    await handleWebhook({
      req: new Request('https://mediaclaw.example/api/payment/notify/stripe', {
        method: 'POST',
      }),
      provider: 'stripe',
    });

    expect(mocks.cancelReferralCommissionForOrder).toHaveBeenCalledWith(
      'ORDER-REFUND-1',
      'payment_refunded'
    );
  });
});
