import {
  approveWithdrawalRequest,
  createWithdrawalRequest,
  rejectWithdrawalRequest,
} from '@/shared/services/referral';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tx: { id: 'tx' },
  getReferralConfig: vi.fn(),
  findPendingWithdrawalByUserId: vi.fn(),
  getOrCreateReferralBalance: vi.fn(),
  moveAvailableToWithdrawing: vi.fn(),
  createReferralWithdrawal: vi.fn(),
  findReferralWithdrawalById: vi.fn(),
  moveWithdrawingToWithdrawn: vi.fn(),
  moveWithdrawingToAvailable: vi.fn(),
  updateReferralWithdrawalStatus: vi.fn(),
}));

vi.mock('@/core/db', () => ({
  db: () => ({
    transaction: async (callback: any) => callback(mocks.tx),
  }),
}));

vi.mock('@/shared/models/config', () => ({
  getAllConfigs: vi.fn(),
}));

vi.mock('@/shared/models/order', () => ({
  findOrderByOrderNo: vi.fn(),
}));

vi.mock('@/shared/lib/hash', () => ({
  getUuid: () => 'uuid-generated',
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
  createReferralWithdrawal: (...args: any[]) =>
    mocks.createReferralWithdrawal(...args),
  decreasePendingBalance: vi.fn(),
  findPendingWithdrawalByUserId: (...args: any[]) =>
    mocks.findPendingWithdrawalByUserId(...args),
  findReferralWithdrawalById: (...args: any[]) =>
    mocks.findReferralWithdrawalById(...args),
  findCommissionByOrderNo: vi.fn(),
  findReferralRelationByReferee: vi.fn(),
  getOrCreateReferralBalance: (...args: any[]) =>
    mocks.getOrCreateReferralBalance(...args),
  getReferralConfig: () => mocks.getReferralConfig(),
  getReferralStatus: vi.fn(),
  getPendingReferralTasks: vi.fn(),
  increasePendingBalance: vi.fn(),
  markReferralTaskDone: vi.fn(),
  moveAvailableToWithdrawing: (...args: any[]) =>
    mocks.moveAvailableToWithdrawing(...args),
  moveLockedToAvailable: vi.fn(),
  movePendingToLocked: vi.fn(),
  moveWithdrawingToAvailable: (...args: any[]) =>
    mocks.moveWithdrawingToAvailable(...args),
  moveWithdrawingToWithdrawn: (...args: any[]) =>
    mocks.moveWithdrawingToWithdrawn(...args),
  updateReferralWithdrawalStatus: (...args: any[]) =>
    mocks.updateReferralWithdrawalStatus(...args),
  updateReferralStatus: vi.fn(),
  updateReferralTaskStatus: vi.fn(),
  upsertReferralTask: vi.fn(),
  updateCommissionStatus: vi.fn(),
}));

describe('referral withdrawal flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getReferralConfig.mockResolvedValue({
      enabled: true,
      firstOrderRate: 30,
      renewalRate: 10,
      inviteeDiscount: 10,
      minSettlement: 10000,
      lockDays: 7,
      maxRefundRate: 30,
    });
    mocks.findPendingWithdrawalByUserId.mockResolvedValue(null);
    mocks.getOrCreateReferralBalance.mockResolvedValue({
      userId: 'referrer-1',
      availableAmount: 15000,
      currency: 'CNY',
    });
    mocks.createReferralWithdrawal.mockResolvedValue({
      id: 'withdrawal-1',
      userId: 'referrer-1',
      amount: 15000,
      status: 'pending',
    });
    mocks.findReferralWithdrawalById.mockResolvedValue({
      id: 'withdrawal-1',
      userId: 'referrer-1',
      amount: 15000,
      status: 'pending',
    });
    mocks.updateReferralWithdrawalStatus.mockImplementation(
      async ({ withdrawalId, status }: any) => ({
        id: withdrawalId,
        status,
      })
    );
  });

  it('moves all available balance to withdrawing when creating a withdrawal request', async () => {
    const result = await createWithdrawalRequest({
      userId: 'referrer-1',
      contactSnapshot: 'wechat: mediaclaw',
    });

    expect(mocks.findPendingWithdrawalByUserId).toHaveBeenCalledWith(
      'referrer-1',
      mocks.tx
    );
    expect(mocks.moveAvailableToWithdrawing).toHaveBeenCalledWith(
      'referrer-1',
      15000,
      mocks.tx
    );
    expect(mocks.createReferralWithdrawal).toHaveBeenCalledWith(
      {
        userId: 'referrer-1',
        amount: 15000,
        currency: 'CNY',
        status: 'pending',
        contactSnapshot: 'wechat: mediaclaw',
      },
      mocks.tx
    );
    expect(result).toMatchObject({
      id: 'withdrawal-1',
      status: 'pending',
    });
  });

  it('blocks withdrawal creation below the settlement threshold', async () => {
    mocks.getOrCreateReferralBalance.mockResolvedValue({
      userId: 'referrer-1',
      availableAmount: 9900,
      currency: 'CNY',
    });

    await expect(
      createWithdrawalRequest({ userId: 'referrer-1' })
    ).rejects.toThrow(
      'Available balance has not reached the withdrawal threshold'
    );
    expect(mocks.moveAvailableToWithdrawing).not.toHaveBeenCalled();
    expect(mocks.createReferralWithdrawal).not.toHaveBeenCalled();
  });

  it('moves withdrawing balance to withdrawn when approving a request', async () => {
    const result = await approveWithdrawalRequest({
      withdrawalId: 'withdrawal-1',
      reviewedBy: 'admin-1',
      reviewNote: 'paid manually',
    });

    expect(mocks.moveWithdrawingToWithdrawn).toHaveBeenCalledWith(
      'referrer-1',
      15000,
      mocks.tx
    );
    expect(mocks.updateReferralWithdrawalStatus).toHaveBeenCalledWith({
      withdrawalId: 'withdrawal-1',
      status: 'paid',
      reviewNote: 'paid manually',
      reviewedBy: 'admin-1',
      tx: mocks.tx,
    });
    expect(result).toMatchObject({
      id: 'withdrawal-1',
      status: 'paid',
    });
  });

  it('returns withdrawing balance to available when rejecting a request', async () => {
    const result = await rejectWithdrawalRequest({
      withdrawalId: 'withdrawal-1',
      reviewedBy: 'admin-1',
      reviewNote: 'invalid contact',
    });

    expect(mocks.moveWithdrawingToAvailable).toHaveBeenCalledWith(
      'referrer-1',
      15000,
      mocks.tx
    );
    expect(mocks.updateReferralWithdrawalStatus).toHaveBeenCalledWith({
      withdrawalId: 'withdrawal-1',
      status: 'rejected',
      reviewNote: 'invalid contact',
      reviewedBy: 'admin-1',
      tx: mocks.tx,
    });
    expect(result).toMatchObject({
      id: 'withdrawal-1',
      status: 'rejected',
    });
  });
});
