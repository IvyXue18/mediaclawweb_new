import crypto from 'node:crypto';
import { PaymentStatus, PaymentType } from '@/extensions/payment/types';
import { ZpayProvider } from '@/extensions/payment/zpay';
import { handleCheckoutSuccess } from '@/shared/services/payment';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  beginOrderCredentialSync: vi.fn(),
  updateOrderByOrderNo: vi.fn(),
  updateOrderInTransaction: vi.fn(),
  updateCreditCredentialCodeByOrderNo: vi.fn(),
  findCredentialBySourceOrderNo: vi.fn(),
  findCredentialByCode: vi.fn(),
  findCredentialByCodeAndOwner: vi.fn(),
  createCredential: vi.fn(),
  syncCredentialCreditSummary: vi.fn(),
  processReferralCommission: vi.fn(),
  queueReferralCommissionRepair: vi.fn(),
  getAllConfigs: vi.fn(),
  getUuid: vi.fn(),
  getSnowId: vi.fn(),
  dbInserts: [] as any[],
  dbUpdates: [] as any[],
  credentialCreditSummary: null as any,
}));

vi.mock('@/config', () => ({
  envConfigs: {
    app_url: 'https://mediaclaw.example',
    auth_secret: 'test-secret',
    license_api_base: '',
    license_internal_token: 'internal-token',
  },
}));

vi.mock('@/shared/lib/hash', () => ({
  getUuid: () => mocks.getUuid(),
  getSnowId: () => mocks.getSnowId(),
}));

vi.mock('@/shared/models/config', () => ({
  getAllConfigs: () => mocks.getAllConfigs(),
}));

vi.mock('@/shared/models/order', () => ({
  OrderStatus: {
    PENDING: 'pending',
    CREATED: 'created',
    COMPLETED: 'completed',
    PAID: 'paid',
    FAILED: 'failed',
  },
  OrderCredentialAction: {
    NONE: 'none',
    ISSUE: 'issue',
    RECHARGE: 'recharge',
  },
  OrderCredentialSyncStatus: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    DONE: 'done',
    FAILED: 'failed',
  },
  beginOrderCredentialSync: (...args: any[]) =>
    mocks.beginOrderCredentialSync(...args),
  updateOrderByOrderNo: (...args: any[]) => mocks.updateOrderByOrderNo(...args),
  updateOrderInTransaction: (...args: any[]) =>
    mocks.updateOrderInTransaction(...args),
}));

vi.mock('@/shared/models/credit', () => ({
  CreditStatus: {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    DELETED: 'deleted',
  },
  CreditTransactionScene: {
    PAYMENT: 'payment',
    SUBSCRIPTION: 'subscription',
    RENEWAL: 'renewal',
    GIFT: 'gift',
    REWARD: 'reward',
  },
  CreditTransactionType: {
    GRANT: 'grant',
    CONSUME: 'consume',
    EXPENSE: 'expense',
  },
  calculateCreditExpirationTime: ({
    creditsValidDays,
    currentPeriodEnd,
  }: {
    creditsValidDays: number;
    currentPeriodEnd?: Date;
  }) => {
    if (currentPeriodEnd) {
      return currentPeriodEnd;
    }
    if (!creditsValidDays || creditsValidDays <= 0) {
      return null;
    }
    return new Date('2026-07-16T00:00:00.000Z');
  },
  updateCreditCredentialCodeByOrderNo: (...args: any[]) =>
    mocks.updateCreditCredentialCodeByOrderNo(...args),
}));

vi.mock('@/shared/models/credential', () => ({
  findCredentialBySourceOrderNo: (...args: any[]) =>
    mocks.findCredentialBySourceOrderNo(...args),
  findCredentialByCode: (...args: any[]) => mocks.findCredentialByCode(...args),
  findCredentialByCodeAndOwner: (...args: any[]) =>
    mocks.findCredentialByCodeAndOwner(...args),
  createCredential: (...args: any[]) => mocks.createCredential(...args),
  syncCredentialCreditSummary: (...args: any[]) =>
    mocks.syncCredentialCreditSummary(...args),
}));

vi.mock('@/shared/models/subscription', () => ({
  SubscriptionStatus: {
    ACTIVE: 'active',
    CANCELED: 'canceled',
  },
  updateSubscriptionBySubscriptionNo: vi.fn(),
  updateSubscriptionInTransaction: vi.fn(),
}));

vi.mock('@/shared/services/referral', () => ({
  processReferralCommission: (...args: any[]) =>
    mocks.processReferralCommission(...args),
  queueReferralCommissionRepair: (...args: any[]) =>
    mocks.queueReferralCommissionRepair(...args),
}));

vi.mock('@/core/db', () => {
  function createSelectChain() {
    const chain: any = {
      from: () => chain,
      where: () => chain,
      limit: async () =>
        mocks.credentialCreditSummary ? [mocks.credentialCreditSummary] : [],
    };
    return chain;
  }

  return {
    db: () => ({
      select: () => createSelectChain(),
      insert: () => ({
        values: async (values: any) => {
          mocks.dbInserts.push(values);
          return [values];
        },
      }),
      update: () => ({
        set: (values: any) => {
          mocks.dbUpdates.push(values);
          return {
            where: async () => [],
          };
        },
      }),
    }),
  };
});

const successSession = {
  provider: 'zpay',
  paymentStatus: PaymentStatus.SUCCESS,
  paymentInfo: {
    paymentAmount: 9900,
    paymentCurrency: 'CNY',
    transactionId: 'zpay-trade-1',
    paidAt: new Date('2026-06-16T08:00:00.000Z'),
  },
  paymentResult: {
    provider: 'zpay',
  },
};

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

function buildSignedZpayRequest(params: Record<string, string>) {
  const signedParams: Record<string, string> = {
    ...params,
    sign_type: 'MD5',
  };
  signedParams.sign = signZpayParams(signedParams, 'zpay-secret');

  const url = new URL('http://localhost/api/payment/notify/zpay');
  Object.entries(signedParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new Request(url);
}

function buildOrder(overrides: Record<string, any> = {}) {
  return {
    id: 'order-row-1',
    orderNo: 'ORDER-1001',
    userId: 'user-1',
    userEmail: 'user@example.com',
    status: 'created',
    amount: 9900,
    currency: 'CNY',
    productId: 'pro-1m',
    productName: 'MediaClaw Pro',
    planName: 'Pro',
    paymentProvider: 'zpay',
    paymentType: PaymentType.ONE_TIME,
    paymentInterval: 'month',
    paymentProductId: 'pro-1m',
    creditsAmount: 100,
    creditsValidDays: 30,
    credentialAction: 'issue',
    credentialSyncStatus: 'pending',
    credentialProcessedAt: null,
    credentialCode: null,
    discountAmount: 0,
    discountCurrency: 'CNY',
    discountCode: '',
    ...overrides,
  };
}

describe('payment success credential sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dbInserts = [];
    mocks.dbUpdates = [];
    mocks.credentialCreditSummary = null;
    mocks.getUuid.mockReturnValue('uuid-generated');
    mocks.getSnowId.mockReturnValue('snow-generated');
    mocks.getAllConfigs.mockResolvedValue({
      pricing_products: JSON.stringify({
        'pro-1m': {
          duration_preset: '1m',
          max_bindings: 2,
        },
      }),
    });
    mocks.beginOrderCredentialSync.mockResolvedValue({ orderNo: 'ORDER-1001' });
    mocks.updateOrderInTransaction.mockResolvedValue(undefined);
    mocks.updateOrderByOrderNo.mockResolvedValue(undefined);
    mocks.updateCreditCredentialCodeByOrderNo.mockResolvedValue([]);
    mocks.findCredentialBySourceOrderNo.mockResolvedValue(null);
    mocks.findCredentialByCode.mockResolvedValue(null);
    mocks.findCredentialByCodeAndOwner.mockResolvedValue({
      id: 'credential-1',
      code: 'ACT-TRIAL-0000',
      ownerUserId: 'user-1',
      planCode: 'trial',
      expiresAt: new Date('2026-06-20T00:00:00.000Z'),
      status: 'active',
      notes: '',
    });
    mocks.createCredential.mockImplementation(async (values: any) => values);
    mocks.syncCredentialCreditSummary.mockResolvedValue(undefined);
    mocks.processReferralCommission.mockResolvedValue(undefined);
    mocks.queueReferralCommissionRepair.mockResolvedValue(undefined);
  });

  it('issues a new activation code and links granted credits to it after payment succeeds', async () => {
    const order = buildOrder();

    await handleCheckoutSuccess({
      order: order as any,
      session: successSession as any,
    });

    const createdCredential = mocks.createCredential.mock.calls[0][0];
    expect(createdCredential).toMatchObject({
      ownerUserId: 'user-1',
      sourceOrderNo: 'ORDER-1001',
      planCode: 'pro-1m',
      durationPreset: '1m',
      maxBindings: 2,
      status: 'active',
    });
    expect(createdCredential.code).toMatch(/^ACT-[A-HJ-NP-Z2-9]{4}-/);

    expect(mocks.updateCreditCredentialCodeByOrderNo).toHaveBeenCalledWith({
      orderNo: 'ORDER-1001',
      credentialCode: createdCredential.code,
    });
    expect(mocks.syncCredentialCreditSummary).toHaveBeenCalledWith({
      credentialCode: createdCredential.code,
      ownerUserId: 'user-1',
      orderNo: 'ORDER-1001',
    });
    expect(mocks.updateOrderByOrderNo).toHaveBeenCalledWith(
      'ORDER-1001',
      expect.objectContaining({
        credentialCode: createdCredential.code,
        credentialSyncStatus: 'done',
        credentialSyncError: null,
      })
    );
    expect(mocks.processReferralCommission).toHaveBeenCalledWith({
      order,
      paymentAmount: 9900,
      paymentCurrency: 'CNY',
    });
  });

  it('issues one partner credential per paid seat with partner attribution', async () => {
    const order = buildOrder({
      partnerId: 'supplier-one',
      variantId: 'supplier-one-white-label',
      seatCount: 3,
      priceRuleSnapshot: JSON.stringify({
        partnerId: 'supplier-one',
        variantId: 'supplier-one-white-label',
        creditsPerSeat: 100,
      }),
    });

    await handleCheckoutSuccess({
      order: order as any,
      session: successSession as any,
    });

    expect(mocks.createCredential).toHaveBeenCalledTimes(3);
    expect(
      mocks.createCredential.mock.calls.map(([values]: any[]) => ({
        sourceOrderNo: values.sourceOrderNo,
        partnerId: values.partnerId,
        variantId: values.variantId,
        ownerUserId: values.ownerUserId,
      }))
    ).toEqual([
      {
        sourceOrderNo: 'ORDER-1001',
        partnerId: 'supplier-one',
        variantId: 'supplier-one-white-label',
        ownerUserId: 'user-1',
      },
      {
        sourceOrderNo: 'ORDER-1001#2',
        partnerId: 'supplier-one',
        variantId: 'supplier-one-white-label',
        ownerUserId: 'user-1',
      },
      {
        sourceOrderNo: 'ORDER-1001#3',
        partnerId: 'supplier-one',
        variantId: 'supplier-one-white-label',
        ownerUserId: 'user-1',
      },
    ]);
    expect(
      mocks.dbInserts.filter((item: any) => item.totalCredits !== undefined)
        .length
    ).toBe(3);
    expect(mocks.updateOrderByOrderNo).toHaveBeenCalledWith(
      'ORDER-1001',
      expect.objectContaining({
        credentialCode: expect.stringMatching(/^ACT-[A-HJ-NP-Z2-9]{4}-/),
        credentialSyncStatus: 'done',
        credentialSyncError: null,
      })
    );
  });

  it('parses a signed Zpay partner notification and issues paid seats locally', async () => {
    const provider = new ZpayProvider({
      pid: '1001',
      pkey: 'zpay-secret',
    });
    const event = await provider.getPaymentEvent({
      req: buildSignedZpayRequest({
        pid: '1001',
        trade_no: 'zpay-partner-trade-1',
        out_trade_no: 'ORDER-1001',
        type: 'alipay',
        name: 'Supplier One bulk seats',
        money: '99.00',
        trade_status: 'TRADE_SUCCESS',
      }),
    });
    const order = buildOrder({
      partnerId: 'supplier-one',
      variantId: 'supplier-one-white-label',
      seatCount: 3,
      priceRuleSnapshot: JSON.stringify({
        partnerId: 'supplier-one',
        variantId: 'supplier-one-white-label',
        creditsPerSeat: 100,
      }),
    });

    await handleCheckoutSuccess({
      order: order as any,
      session: event.paymentSession as any,
    });

    expect(event.paymentSession?.paymentInfo).toMatchObject({
      paymentAmount: 9900,
      paymentCurrency: 'CNY',
      transactionId: 'zpay-partner-trade-1',
    });
    expect(mocks.createCredential).toHaveBeenCalledTimes(3);
    expect(
      mocks.createCredential.mock.calls.map(([values]: any[]) => ({
        sourceOrderNo: values.sourceOrderNo,
        partnerId: values.partnerId,
        variantId: values.variantId,
      }))
    ).toEqual([
      {
        sourceOrderNo: 'ORDER-1001',
        partnerId: 'supplier-one',
        variantId: 'supplier-one-white-label',
      },
      {
        sourceOrderNo: 'ORDER-1001#2',
        partnerId: 'supplier-one',
        variantId: 'supplier-one-white-label',
      },
      {
        sourceOrderNo: 'ORDER-1001#3',
        partnerId: 'supplier-one',
        variantId: 'supplier-one-white-label',
      },
    ]);
    expect(mocks.updateOrderByOrderNo).toHaveBeenCalledWith(
      'ORDER-1001',
      expect.objectContaining({
        credentialCode: expect.stringMatching(/^ACT-[A-HJ-NP-Z2-9]{4}-/),
        credentialSyncStatus: 'done',
        credentialSyncError: null,
      })
    );
  });

  it('upgrades a trial credential during recharge and records the credit top-up summary', async () => {
    const order = buildOrder({
      orderNo: 'ORDER-RECHARGE-1',
      credentialAction: 'recharge',
      credentialCode: 'ACT-TRIAL-0000',
      creditsAmount: 50,
    });
    mocks.beginOrderCredentialSync.mockResolvedValue({
      orderNo: 'ORDER-RECHARGE-1',
    });

    await handleCheckoutSuccess({
      order: order as any,
      session: successSession as any,
    });

    expect(mocks.dbInserts[0]).toMatchObject({
      credentialId: 'credential-1',
      credentialCode: 'ACT-TRIAL-0000',
      userId: 'user-1',
      orderNo: 'ORDER-RECHARGE-1',
      totalCredits: 50,
      usedCredits: 0,
      status: 'active',
    });
    expect(mocks.dbUpdates[0]).toMatchObject({
      status: 'active',
      maxBindings: 2,
      planCode: 'pro-1m',
      durationPreset: '1m',
    });
    expect(mocks.updateOrderByOrderNo).toHaveBeenCalledWith(
      'ORDER-RECHARGE-1',
      expect.objectContaining({
        credentialCode: 'ACT-TRIAL-0000',
        credentialSyncStatus: 'done',
        credentialSyncError: null,
      })
    );
  });

  it('does not re-run credential sync for an already processed paid order', async () => {
    const order = buildOrder({
      status: 'paid',
      credentialSyncStatus: 'done',
      credentialProcessedAt: new Date('2026-06-16T08:00:00.000Z'),
    });

    await handleCheckoutSuccess({
      order: order as any,
      session: successSession as any,
    });

    expect(mocks.updateOrderInTransaction).not.toHaveBeenCalled();
    expect(mocks.beginOrderCredentialSync).not.toHaveBeenCalled();
    expect(mocks.createCredential).not.toHaveBeenCalled();
    expect(mocks.processReferralCommission).toHaveBeenCalledTimes(1);
  });

  it('marks credential sync as failed when local issuing fails, while still attempting referral repair paths', async () => {
    const order = buildOrder({
      orderNo: 'ORDER-ISSUE-FAILED',
    });
    mocks.beginOrderCredentialSync.mockResolvedValue({
      orderNo: 'ORDER-ISSUE-FAILED',
    });
    mocks.createCredential.mockRejectedValue(new Error('local issue failed'));

    await expect(
      handleCheckoutSuccess({
        order: order as any,
        session: successSession as any,
      })
    ).rejects.toThrow('local issue failed');

    expect(mocks.updateOrderByOrderNo).toHaveBeenCalledWith(
      'ORDER-ISSUE-FAILED',
      expect.objectContaining({
        credentialSyncStatus: 'failed',
        credentialSyncError: 'local issue failed',
      })
    );
    expect(mocks.processReferralCommission).toHaveBeenCalledWith({
      order,
      paymentAmount: 9900,
      paymentCurrency: 'CNY',
    });
  });
});
