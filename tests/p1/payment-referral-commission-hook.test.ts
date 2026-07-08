import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PaymentStatus } from '@/core/payment/types';
import { handleCheckoutSuccess } from '@/modules/payment/service';

const mocks = vi.hoisted(() => ({
  orderRow: null as any,
  dbInserts: [] as any[],
  dbUpdates: [] as any[],
  getCredentialByCode: vi.fn(),
  rechargeCredential: vi.fn(),
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
  ensureCredentialIssueCreditLedgerForOrder: vi.fn(async () => ({
    inserted: false,
    credentialCode: null,
  })),
  getCredentialByCode: (...args: any[]) => mocks.getCredentialByCode(...args),
  rechargeCredential: (...args: any[]) => mocks.rechargeCredential(...args),
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
      values: vi.fn(async (values: any) => {
        mocks.dbInserts.push(values);
        return [];
      }),
    })),
    update: vi.fn(() => ({
      set: (values: any) => {
        mocks.dbUpdates.push(values);
        return {
          where: vi.fn(() => ({
            returning: vi.fn(async () => [{ id: 'order-row-1' }]),
          })),
        };
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
          return {
            where: vi.fn(() => ({
              returning: vi.fn(async () => [{ id: 'order-row-1' }]),
            })),
          };
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
    mocks.dbInserts = [];
    mocks.dbUpdates = [];
    mocks.orderRow = buildOrder();
    mocks.getCredentialByCode.mockResolvedValue({
      id: 'credential-1',
      code: 'ACT-TRIAL-0000',
      ownerUserId: 'invitee-1',
      planCode: 'trial',
      durationPreset: 'trial',
      maxBindings: 1,
      expiresAt: new Date('2026-07-10T23:59:59.999Z'),
      status: 'active',
    });
    mocks.rechargeCredential.mockResolvedValue({
      id: 'credential-1',
      code: 'ACT-TRIAL-0000',
    });
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

  it('repairs referral commission when a duplicate callback finds the order already paid', async () => {
    mocks.orderRow = buildOrder({
      status: 'paid',
      paymentAmount: 1000,
      paymentCurrency: 'CNY',
    });

    await handleCheckoutSuccess(successSession, 'zpay');

    expect(mocks.processReferralCommissionForPaidOrder).toHaveBeenCalledWith({
      order: expect.objectContaining({
        orderNo: 'ORDER-1001',
        userId: 'invitee-1',
      }),
      paymentAmount: 1000,
      paymentCurrency: 'CNY',
    });
  });

  it('passes the paid order number into credential recharge for idempotency', async () => {
    mocks.orderRow = buildOrder({
      orderNo: 'ORDER-RECHARGE-1',
      credentialAction: 'recharge',
      credentialCode: 'ACT-TRIAL-0000',
      creditsAmount: 180,
      creditsValidDays: 30,
    });

    await handleCheckoutSuccess(successSession, 'zpay');

    expect(mocks.rechargeCredential).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'credential-1',
        credits: 180,
        durationDays: 30,
        orderNo: 'ORDER-RECHARGE-1',
      })
    );
  });

  it('creates one subscription record after claiming a subscription checkout', async () => {
    mocks.orderRow = buildOrder({
      paymentType: 'subscription',
      productName: 'MediaClaw Pro',
      planName: 'Pro Monthly',
    });

    await handleCheckoutSuccess(
      {
        ...successSession,
        subscriptionId: 'sub-provider-1',
        subscriptionInfo: {
          status: 'active',
          amount: 9900,
          currency: 'CNY',
          interval: 'month',
          intervalCount: 1,
          currentPeriodStart: new Date('2026-07-08T00:00:00.000Z'),
          currentPeriodEnd: new Date('2026-08-08T00:00:00.000Z'),
        },
        subscriptionResult: { id: 'sub-provider-1' },
      },
      'stripe'
    );

    expect(
      mocks.dbInserts.filter(
        (values) => values.subscriptionId === 'sub-provider-1'
      )
    ).toHaveLength(1);
  });
});
