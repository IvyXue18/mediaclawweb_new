import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getReferralConfig,
  processReferralCommissionForPaidOrder,
  repairMissingReferralCommissions,
} from '@/modules/referral/service';

const fixedDate = new Date('2026-06-18T09:00:00.000Z');

const mocks = vi.hoisted(() => ({
  getAllConfigs: vi.fn(),
}));

const dbState = vi.hoisted(() => ({
  relation: null as any,
  existingCommission: null as any,
  account: null as any,
  repairRelations: null as any[] | null,
  repairOrders: null as any[] | null,
  selectCalls: 0,
  insertedCommission: null as any,
  updateValues: [] as any[],
}));

vi.mock('@/config', () => ({
  envConfigs: {
    app_url: 'https://mediaclaw.example',
  },
}));

vi.mock('@/modules/config/service', () => ({
  getAllConfigs: () => mocks.getAllConfigs(),
}));

vi.mock('@/lib/hash', () => ({
  getNonceStr: () => 'ABC',
  getUuid: () => 'commission-1',
}));

vi.mock('@/core/db', () => {
  const tx = {
    insert: vi.fn(() => ({
      values: (values: any) => {
        dbState.insertedCommission = values;
        return {
          returning: vi.fn(async () => [
            {
              ...values,
              createdAt: fixedDate,
              updatedAt: fixedDate,
            },
          ]),
        };
      },
    })),
    update: vi.fn(() => ({
      set: (values: any) => {
        dbState.updateValues.push(values);
        return {
          where: vi.fn(() => ({
            returning: vi.fn(async () => [{ id: 'relation-1', ...values }]),
          })),
        };
      },
    })),
  };

  function selectChain() {
    const chain: any = {
      from: () => chain,
      where: () => chain,
      orderBy: () => chain,
      limit: async () => {
        const callIndex = dbState.selectCalls;
        dbState.selectCalls += 1;
        if (dbState.repairRelations) {
          if (callIndex === 0) return dbState.repairRelations;
          if (callIndex === 1) return dbState.repairOrders || [];
          if (callIndex === 2)
            return dbState.relation ? [dbState.relation] : [];
          if (callIndex === 3) {
            return dbState.existingCommission
              ? [dbState.existingCommission]
              : [];
          }
          if (callIndex === 4) return dbState.account ? [dbState.account] : [];
        }
        if (callIndex === 0) return dbState.relation ? [dbState.relation] : [];
        if (callIndex === 1) {
          return dbState.existingCommission ? [dbState.existingCommission] : [];
        }
        return dbState.account ? [dbState.account] : [];
      },
    };
    return chain;
  }

  return {
    db: () => ({
      select: vi.fn(() => selectChain()),
      update: tx.update,
      transaction: vi.fn(async (callback: any) => callback(tx)),
    }),
  };
});

function resetDbState() {
  dbState.relation = {
    id: 'relation-1',
    referrerId: 'referrer-1',
    refereeId: 'invitee-1',
    referralCode: 'MCREF',
    hasFirstOrder: false,
  };
  dbState.existingCommission = null;
  dbState.account = {
    userId: 'referrer-1',
    status: 'active',
    currency: 'cny',
  };
  dbState.repairRelations = null;
  dbState.repairOrders = null;
  dbState.selectCalls = 0;
  dbState.insertedCommission = null;
  dbState.updateValues = [];
}

describe('referral commission service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbState();
    mocks.getAllConfigs.mockResolvedValue({
      referral_first_order_rate: '30',
      referral_renewal_rate: '10',
      pricing_products: JSON.stringify({
        'pro-1m': { fulfillment: 'credential' },
        'credits-100': { fulfillment: 'credits_only' },
      }),
    });
  });

  it('uses the 20/20/10 partner-program defaults', async () => {
    mocks.getAllConfigs.mockResolvedValue({});

    await expect(getReferralConfig()).resolves.toMatchObject({
      firstOrderRate: 20,
      renewalRate: 20,
      inviteeDiscount: 10,
    });
  });

  it('honors configured zero rates instead of falling back to defaults', async () => {
    mocks.getAllConfigs.mockResolvedValue({
      referral_first_order_rate: '0',
      referral_renewal_rate: '0',
      referral_invitee_discount: '0',
    });

    await expect(getReferralConfig()).resolves.toMatchObject({
      firstOrderRate: 0,
      renewalRate: 0,
      inviteeDiscount: 0,
    });
  });

  it('marks a zero-rate first order so later orders use the renewal rate', async () => {
    mocks.getAllConfigs.mockResolvedValue({
      referral_first_order_rate: '0',
      referral_renewal_rate: '5',
      pricing_products: JSON.stringify({
        'pro-1m': { fulfillment: 'credential' },
      }),
    });

    const result = await processReferralCommissionForPaidOrder({
      order: {
        orderNo: 'ORDER-ZERO-RATE',
        userId: 'invitee-1',
        productId: 'pro-1m',
        amount: 10000,
        currency: 'CNY',
      },
    });

    expect(result).toBeNull();
    expect(dbState.insertedCommission).toBeNull();
    expect(dbState.updateValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          hasFirstOrder: true,
          firstOrderNo: 'ORDER-ZERO-RATE',
        }),
      ])
    );
  });

  it('creates a pending first-order commission and marks the relation', async () => {
    const result = await processReferralCommissionForPaidOrder({
      order: {
        orderNo: 'ORDER-1001',
        userId: 'invitee-1',
        productId: 'pro-1m',
        amount: 10000,
        currency: 'CNY',
      },
    });

    expect(dbState.insertedCommission).toMatchObject({
      id: 'commission-1',
      referrerUserId: 'referrer-1',
      inviteeUserId: 'invitee-1',
      orderNo: 'ORDER-1001',
      amount: 3000,
      currency: 'cny',
      rate: 30,
      status: 'pending',
      reason: 'first_order',
    });
    expect(dbState.updateValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          pendingCommission: expect.anything(),
          totalCommission: expect.anything(),
        }),
        expect.objectContaining({
          hasFirstOrder: true,
          firstOrderNo: 'ORDER-1001',
        }),
      ])
    );
    expect(result).toMatchObject({
      id: 'commission-1',
      orderNo: 'ORDER-1001',
      amount: 3000,
    });
  });

  it('does not create duplicate commission records for the same order', async () => {
    dbState.existingCommission = {
      id: 'existing-commission',
      orderNo: 'ORDER-1001',
    };

    const result = await processReferralCommissionForPaidOrder({
      order: {
        orderNo: 'ORDER-1001',
        userId: 'invitee-1',
        productId: 'pro-1m',
        amount: 10000,
      },
    });

    expect(result).toEqual(dbState.existingCommission);
    expect(dbState.insertedCommission).toBeNull();
    expect(dbState.updateValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          hasFirstOrder: true,
          firstOrderNo: 'ORDER-1001',
        }),
      ])
    );
  });

  it('repairs paid orders that were completed before the referral relation was written', async () => {
    dbState.repairRelations = [
      {
        ...dbState.relation,
        createdAt: new Date('2026-07-08T08:05:00.000Z'),
        status: 'active',
      },
    ];
    dbState.repairOrders = [
      {
        orderNo: 'ORDER-RACE-1',
        userId: 'invitee-1',
        productId: 'pro-1m',
        amount: 10000,
        currency: 'CNY',
        paymentAmount: 10000,
        paymentCurrency: 'CNY',
        createdAt: new Date('2026-07-08T08:04:00.000Z'),
        paidAt: new Date('2026-07-08T08:04:30.000Z'),
      },
    ];

    const result = await repairMissingReferralCommissions();

    expect(result).toMatchObject({
      scannedRelations: 1,
      candidateOrders: 1,
      repairedCommissions: 1,
    });
    expect(dbState.insertedCommission).toMatchObject({
      orderNo: 'ORDER-RACE-1',
      referrerUserId: 'referrer-1',
      inviteeUserId: 'invitee-1',
      amount: 3000,
      reason: 'first_order',
    });
    expect(dbState.updateValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          hasFirstOrder: true,
          firstOrderNo: 'ORDER-RACE-1',
        }),
      ])
    );
  });

  it('skips credit-pack renewal commissions', async () => {
    dbState.relation.hasFirstOrder = true;

    const result = await processReferralCommissionForPaidOrder({
      order: {
        orderNo: 'ORDER-CREDITS-1',
        userId: 'invitee-1',
        productId: 'credits-100',
        amount: 2900,
      },
    });

    expect(result).toBeNull();
    expect(dbState.insertedCommission).toBeNull();
    expect(dbState.updateValues).toHaveLength(0);
  });
});
