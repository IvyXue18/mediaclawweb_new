import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PaymentStatus } from '@/core/payment/types';
import { handleCheckoutSuccess } from '@/modules/payment/service';

const mocks = vi.hoisted(() => ({
  orderRow: null as any,
  dbUpdates: [] as any[],
  processReferralCommissionForPaidOrder: vi.fn(),
}));

vi.mock('@/config', () => ({
  envConfigs: {
    app_url: 'https://mediaclaw.example',
  },
}));

vi.mock('@/modules/config/service', () => ({
  getAllConfigs: vi.fn(),
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
  processReferralCommissionForPaidOrder: (...args: any[]) =>
    mocks.processReferralCommissionForPaidOrder(...args),
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

vi.mock('@/core/db', () => {
  const tx = {
    insert: vi.fn(() => ({
      values: vi.fn(async () => []),
    })),
    update: vi.fn(() => ({
      set: (values: any) => {
        mocks.dbUpdates.push(values);
        return { where: vi.fn(async () => []) };
      },
    })),
  };

  function selectChain() {
    const chain: any = {
      from: () => chain,
      where: () => chain,
      limit: async () => (mocks.orderRow ? [mocks.orderRow] : []),
    };
    return chain;
  }

  return {
    db: () => ({
      select: vi.fn(() => selectChain()),
      transaction: vi.fn(async (callback: any) => callback(tx)),
      update: vi.fn(() => ({
        set: (values: any) => {
          mocks.dbUpdates.push(values);
          return { where: vi.fn(async () => []) };
        },
      })),
    }),
  };
});

function buildOrder(overrides: Record<string, any> = {}) {
  return {
    id: 'order-row-1',
    orderNo: 'ORDER-1001',
    userId: 'invitee-1',
    userEmail: 'invitee@example.com',
    status: 'created',
    amount: 9900,
    currency: 'CNY',
    productId: 'pro-1m',
    paymentProvider: 'zpay',
    paymentSessionId: 'sess-1',
    paymentType: 'one-time',
    credentialAction: 'none',
    creditsAmount: 0,
    partnerId: null,
    ...overrides,
  };
}

const successSession = {
  paymentStatus: PaymentStatus.SUCCESS,
  paymentResult: { id: 'sess-1' },
  paymentInfo: {
    paymentAmount: 9900,
    paymentCurrency: 'CNY',
    transactionId: 'trade-1',
    paidAt: new Date('2026-06-18T09:00:00.000Z'),
  },
};

describe('payment referral commission hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dbUpdates = [];
    mocks.orderRow = buildOrder();
    mocks.processReferralCommissionForPaidOrder.mockResolvedValue(undefined);
  });

  it('processes referral commission after a successful checkout', async () => {
    await handleCheckoutSuccess(successSession, 'zpay');

    expect(mocks.processReferralCommissionForPaidOrder).toHaveBeenCalledWith({
      order: expect.objectContaining({
        orderNo: 'ORDER-1001',
        userId: 'invitee-1',
      }),
      paymentAmount: 9900,
      paymentCurrency: 'CNY',
    });
  });

  it('does not process consumer referral commission for partner bulk orders', async () => {
    mocks.orderRow = buildOrder({ partnerId: 'partner-1' });

    await handleCheckoutSuccess(successSession, 'zpay');

    expect(mocks.processReferralCommissionForPaidOrder).not.toHaveBeenCalled();
  });
});
