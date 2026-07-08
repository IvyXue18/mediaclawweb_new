import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rechargeCredential } from '@/modules/credentials/service';

const mocks = vi.hoisted(() => ({
  existingCredential: {
    id: 'credential-1',
    code: 'ACT-TRIAL-0000',
    ownerUserId: 'user-1',
    sourceOrderNo: null,
    planCode: 'trial',
    durationPreset: 'trial',
    maxBindings: 1,
    expiresAt: new Date('2026-07-10T23:59:59.999Z'),
    status: 'active',
    notes: '',
    deletedAt: null,
  },
  alreadyAppliedCredit: null as any,
  txUpdates: [] as any[],
  txInserts: [] as any[],
}));

vi.mock('@/lib/hash', () => ({
  getNonceStr: () => 'ABCD',
  getSnowId: () => 'TXN-1',
  getUuid: () => 'uuid-1',
}));

vi.mock('@/core/db', () => {
  function credentialSelectChain() {
    const chain: any = {
      from: () => chain,
      where: () => chain,
      limit: async () => [mocks.existingCredential],
    };
    return chain;
  }

  function appliedCreditSelectChain() {
    const chain: any = {
      from: () => chain,
      where: () => chain,
      limit: async () =>
        mocks.alreadyAppliedCredit ? [mocks.alreadyAppliedCredit] : [],
    };
    return chain;
  }

  const tx = {
    select: () => appliedCreditSelectChain(),
    update: () => ({
      set: (values: any) => {
        mocks.txUpdates.push(values);
        return {
          where: () => ({
            returning: async () => [{ ...mocks.existingCredential, ...values }],
          }),
        };
      },
    }),
    insert: () => ({
      values: async (values: any) => {
        mocks.txInserts.push(values);
        return [values];
      },
    }),
  };

  return {
    db: () => ({
      select: () => credentialSelectChain(),
      transaction: async (callback: any) => callback(tx),
    }),
  };
});

describe('credential recharge idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.alreadyAppliedCredit = null;
    mocks.txUpdates = [];
    mocks.txInserts = [];
  });

  it('skips a paid recharge when the same order already has a recharge ledger row', async () => {
    mocks.alreadyAppliedCredit = { id: 'credit-1' };

    const result = await rechargeCredential({
      id: 'credential-1',
      credits: 180,
      durationDays: 30,
      orderNo: 'ORDER-RECHARGE-1',
      planCode: 'pro-1m',
      durationPreset: 'monthly',
      status: 'active',
      notes: 'paid recharge from order ORDER-RECHARGE-1',
    });

    expect(result).toBe(mocks.existingCredential);
    expect(mocks.txUpdates).toEqual([]);
    expect(mocks.txInserts).toEqual([]);
  });
});
