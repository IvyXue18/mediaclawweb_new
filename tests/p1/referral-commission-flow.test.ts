import {
  handleRefundCommission,
  processReferralCommission,
} from '@/shared/services/referral';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  txInsertedValues: [] as any[],
  txUpdatedValues: [] as any[],
  getAllConfigs: vi.fn(),
  getReferralConfig: vi.fn(),
  findCommissionByOrderNo: vi.fn(),
  refundCommission: null as any,
  refundRiskSummary: { totalCount: 0, canceledCount: 0 } as any,
  findReferralRelationByReferee: vi.fn(),
  getReferralStatus: vi.fn(),
  increasePendingBalance: vi.fn(),
  decreasePendingBalance: vi.fn(),
  updateCommissionStatus: vi.fn(),
  getOrCreateReferralBalance: vi.fn(),
  markReferralTaskDone: vi.fn(),
  movePendingToLocked: vi.fn(),
  getUuid: vi.fn(),
}));

vi.mock('@/core/db', () => {
  let selectCallIndex = 0;
  const tx = {
    select: vi.fn(() => {
      const callIndex = selectCallIndex;
      selectCallIndex += 1;
      const chain: any = {
        from: () => chain,
        where: async () => {
          if (callIndex === 0) {
            return mocks.refundCommission ? [mocks.refundCommission] : [];
          }

          return [mocks.refundRiskSummary];
        },
      };
      return chain;
    }),
    update: vi.fn(() => ({
      set: (values: any) => {
        mocks.txUpdatedValues.push(values);
        return {
          where: () => ({
            returning: async () => [{ id: 'relation-1' }],
          }),
        };
      },
    })),
    insert: vi.fn(() => ({
      values: async (values: any) => {
        mocks.txInsertedValues.push(values);
        return [values];
      },
    })),
  };

  return {
    db: () => ({
      transaction: async (callback: any) => {
        selectCallIndex = 0;
        return callback(tx);
      },
    }),
  };
});

vi.mock('@/shared/lib/hash', () => ({
  getUuid: () => mocks.getUuid(),
}));

vi.mock('@/shared/models/config', () => ({
  getAllConfigs: () => mocks.getAllConfigs(),
}));

vi.mock('@/shared/models/order', () => ({
  findOrderByOrderNo: vi.fn(),
}));

vi.mock('@/shared/models/referral', () => ({
  CommissionStatus: {
    PENDING: 'pending',
    LOCKED: 'locked',
    SETTLED: 'settled',
    CANCELED: 'canceled',
  },
  CommissionType: {
    FIRST_ORDER: 'first_order',
    RENEWAL: 'renewal',
  },
  ReferralStatus: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    BANNED: 'banned',
  },
  ReferralTaskStatus: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    DONE: 'done',
  },
  WithdrawalStatus: {
    PENDING: 'pending',
    PAID: 'paid',
    REJECTED: 'rejected',
  },
  createReferralWithdrawal: vi.fn(),
  decreasePendingBalance: (...args: any[]) =>
    mocks.decreasePendingBalance(...args),
  findPendingWithdrawalByUserId: vi.fn(),
  findReferralWithdrawalById: vi.fn(),
  findCommissionByOrderNo: (...args: any[]) =>
    mocks.findCommissionByOrderNo(...args),
  findReferralRelationByReferee: (...args: any[]) =>
    mocks.findReferralRelationByReferee(...args),
  getOrCreateReferralBalance: (...args: any[]) =>
    mocks.getOrCreateReferralBalance(...args),
  getReferralConfig: () => mocks.getReferralConfig(),
  getReferralStatus: (...args: any[]) => mocks.getReferralStatus(...args),
  getPendingReferralTasks: vi.fn(),
  increasePendingBalance: (...args: any[]) =>
    mocks.increasePendingBalance(...args),
  markReferralTaskDone: (...args: any[]) => mocks.markReferralTaskDone(...args),
  moveAvailableToWithdrawing: vi.fn(),
  moveLockedToAvailable: vi.fn(),
  movePendingToLocked: (...args: any[]) => mocks.movePendingToLocked(...args),
  moveWithdrawingToAvailable: vi.fn(),
  moveWithdrawingToWithdrawn: vi.fn(),
  updateReferralWithdrawalStatus: vi.fn(),
  updateReferralStatus: vi.fn(),
  updateReferralTaskStatus: vi.fn(),
  upsertReferralTask: vi.fn(),
  updateCommissionStatus: (...args: any[]) =>
    mocks.updateCommissionStatus(...args),
}));

function buildPaidOrder(overrides: Record<string, any> = {}) {
  return {
    orderNo: 'ORDER-1001',
    userId: 'referee-1',
    userEmail: 'referee@example.com',
    amount: 10000,
    paymentAmount: 10000,
    currency: 'CNY',
    paymentCurrency: 'CNY',
    productId: 'pro-1m',
    ...overrides,
  };
}

describe('referral commission flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.txInsertedValues = [];
    mocks.txUpdatedValues = [];
    mocks.refundCommission = null;
    mocks.refundRiskSummary = { totalCount: 0, canceledCount: 0 };
    mocks.getUuid.mockReturnValue('commission-uuid');
    mocks.getReferralConfig.mockResolvedValue({
      enabled: true,
      firstOrderRate: 30,
      renewalRate: 10,
      inviteeDiscount: 10,
      minSettlement: 10000,
      lockDays: 7,
      maxRefundRate: 30,
    });
    mocks.findCommissionByOrderNo.mockResolvedValue(null);
    mocks.findReferralRelationByReferee.mockResolvedValue({
      id: 'relation-1',
      referrerId: 'referrer-1',
      refereeId: 'referee-1',
      referralCode: 'ABCD',
      hasFirstOrder: false,
    });
    mocks.getReferralStatus.mockResolvedValue('active');
    mocks.getAllConfigs.mockResolvedValue({
      pricing_products: JSON.stringify({
        'pro-1m': { type: 'credential' },
        'credits-100': { type: 'credits_only' },
      }),
    });
    mocks.getOrCreateReferralBalance.mockResolvedValue({
      userId: 'referrer-1',
      pendingAmount: 0,
    });
    mocks.increasePendingBalance.mockResolvedValue(undefined);
    mocks.decreasePendingBalance.mockResolvedValue(undefined);
    mocks.updateCommissionStatus.mockResolvedValue(undefined);
    mocks.markReferralTaskDone.mockResolvedValue(undefined);
    mocks.movePendingToLocked.mockResolvedValue(undefined);
  });

  it('creates a first-order commission and marks the repair task done', async () => {
    await processReferralCommission({
      order: buildPaidOrder() as any,
      paymentAmount: 10000,
      paymentCurrency: 'CNY',
    });

    expect(mocks.txInsertedValues[0]).toMatchObject({
      id: 'commission-uuid',
      userId: 'referrer-1',
      relationId: 'relation-1',
      orderNo: 'ORDER-1001',
      orderAmount: 10000,
      orderCurrency: 'CNY',
      commissionRate: 30,
      commissionAmount: 3000,
      commissionCurrency: 'CNY',
      commissionType: 'first_order',
      status: 'pending',
    });
    expect(mocks.increasePendingBalance).toHaveBeenCalledWith(
      'referrer-1',
      3000,
      expect.anything()
    );
    expect(mocks.markReferralTaskDone).toHaveBeenCalledWith(
      'ORDER-1001',
      expect.anything()
    );
  });

  it('skips renewal commission for credit-only products but still marks repair task done', async () => {
    mocks.findReferralRelationByReferee.mockResolvedValue({
      id: 'relation-1',
      referrerId: 'referrer-1',
      refereeId: 'referee-1',
      referralCode: 'ABCD',
      hasFirstOrder: true,
    });

    await processReferralCommission({
      order: buildPaidOrder({
        orderNo: 'ORDER-CREDITS-1',
        productId: 'credits-100',
      }) as any,
      paymentAmount: 2900,
      paymentCurrency: 'CNY',
    });

    expect(mocks.txInsertedValues).toHaveLength(0);
    expect(mocks.increasePendingBalance).not.toHaveBeenCalled();
    expect(mocks.markReferralTaskDone).toHaveBeenCalledWith(
      'ORDER-CREDITS-1',
      expect.anything()
    );
  });

  it('does not create duplicate commission records for the same order', async () => {
    mocks.findCommissionByOrderNo.mockResolvedValue({
      id: 'existing-commission',
      orderNo: 'ORDER-1001',
    });

    await processReferralCommission({
      order: buildPaidOrder() as any,
    });

    expect(mocks.txInsertedValues).toHaveLength(0);
    expect(mocks.increasePendingBalance).not.toHaveBeenCalled();
    expect(mocks.markReferralTaskDone).not.toHaveBeenCalled();
  });

  it('cancels pending commission and deducts pending balance when an order is refunded', async () => {
    mocks.refundCommission = {
      id: 'commission-1',
      userId: 'referrer-1',
      orderNo: 'ORDER-REFUND-1',
      commissionAmount: 3000,
      status: 'pending',
    };

    await handleRefundCommission('ORDER-REFUND-1');

    expect(mocks.updateCommissionStatus).toHaveBeenCalledWith({
      commissionId: 'commission-1',
      status: 'canceled',
      cancelReason: '订单退款',
      tx: expect.anything(),
    });
    expect(mocks.decreasePendingBalance).toHaveBeenCalledWith(
      'referrer-1',
      3000,
      expect.anything()
    );
  });

  it('deducts locked balance when refunding a locked commission', async () => {
    mocks.refundCommission = {
      id: 'commission-locked',
      userId: 'referrer-1',
      orderNo: 'ORDER-REFUND-LOCKED',
      commissionAmount: 5000,
      status: 'locked',
    };

    await handleRefundCommission('ORDER-REFUND-LOCKED');

    expect(mocks.updateCommissionStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        commissionId: 'commission-locked',
        status: 'canceled',
      })
    );
    expect(mocks.decreasePendingBalance).not.toHaveBeenCalled();
    expect(mocks.txUpdatedValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lockedAmount: expect.anything(),
        }),
      ])
    );
  });

  it('does not cancel settled commissions after refund notifications', async () => {
    mocks.refundCommission = {
      id: 'commission-settled',
      userId: 'referrer-1',
      orderNo: 'ORDER-SETTLED',
      commissionAmount: 5000,
      status: 'settled',
    };

    await handleRefundCommission('ORDER-SETTLED');

    expect(mocks.updateCommissionStatus).not.toHaveBeenCalled();
    expect(mocks.decreasePendingBalance).not.toHaveBeenCalled();
  });
});
