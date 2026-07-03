import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createWithdrawalRequest } from '@/modules/referral/service';

const fixedDate = new Date('2026-06-18T08:00:00.000Z');

const mocks = vi.hoisted(() => ({
  getAllConfigs: vi.fn(),
}));

const dbState = vi.hoisted(() => ({
  account: null as any,
  pendingWithdrawal: null as any,
  selectCalls: 0,
  insertedWithdrawal: null as any,
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
  getUuid: () => 'withdrawal-1',
}));

vi.mock('@/core/db', () => {
  const tx = {
    insert: vi.fn(() => ({
      values: (values: any) => {
        dbState.insertedWithdrawal = values;
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
        return { where: vi.fn(async () => []) };
      },
    })),
  };

  function selectChain() {
    const chain: any = {
      from: () => chain,
      where: () => chain,
      limit: async () => {
        const callIndex = dbState.selectCalls;
        dbState.selectCalls += 1;
        if (callIndex === 0) return dbState.account ? [dbState.account] : [];
        return dbState.pendingWithdrawal ? [dbState.pendingWithdrawal] : [];
      },
    };
    return chain;
  }

  return {
    db: () => ({
      select: vi.fn(() => selectChain()),
      transaction: vi.fn(async (callback: any) => callback(tx)),
    }),
  };
});

function resetDbState() {
  dbState.account = {
    id: 'account-1',
    userId: 'user-1',
    inviteCode: 'MCUSER1',
    status: 'active',
    totalInvitees: 2,
    totalCommission: 20000,
    availableCommission: 15000,
    pendingCommission: 5000,
    withdrawnCommission: 0,
    currency: 'CNY',
  };
  dbState.pendingWithdrawal = null;
  dbState.selectCalls = 0;
  dbState.insertedWithdrawal = null;
  dbState.updateValues = [];
}

describe('referral withdrawal service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbState();
    mocks.getAllConfigs.mockResolvedValue({
      referral_min_settlement: '10000',
      referral_lock_days: '7',
    });
  });

  it('moves the full available balance when the old contact-only payload is used', async () => {
    const result = await createWithdrawalRequest({
      userId: 'user-1',
      contactSnapshot: 'wechat: mediaclaw',
    });

    expect(dbState.insertedWithdrawal).toMatchObject({
      id: 'withdrawal-1',
      userId: 'user-1',
      amount: 15000,
      currency: 'cny',
      status: 'pending',
      accountInfo: 'wechat: mediaclaw',
    });
    expect(dbState.updateValues).toHaveLength(1);
    expect(result).toMatchObject({
      id: 'withdrawal-1',
      amount: 15000,
      status: 'pending',
    });
  });

  it('blocks withdrawal creation below the settlement threshold', async () => {
    dbState.account.availableCommission = 9900;

    await expect(createWithdrawalRequest({ userId: 'user-1' })).rejects.toThrow(
      'Available balance has not reached the withdrawal threshold'
    );
    expect(dbState.insertedWithdrawal).toBeNull();
  });

  it('blocks duplicate pending withdrawal requests', async () => {
    dbState.pendingWithdrawal = {
      id: 'withdrawal-pending',
      userId: 'user-1',
      status: 'pending',
    };

    await expect(createWithdrawalRequest({ userId: 'user-1' })).rejects.toThrow(
      'You already have a pending withdrawal request'
    );
    expect(dbState.insertedWithdrawal).toBeNull();
  });
});
