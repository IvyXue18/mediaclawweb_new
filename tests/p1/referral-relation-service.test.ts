import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createReferralRelation } from '@/modules/referral/service';

const fixedDate = new Date('2026-06-18T08:00:00.000Z');

const dbState = vi.hoisted(() => ({
  referrerAccount: null as any,
  existingRelation: null as any,
  selectCalls: 0,
  insertedRelation: null as any,
  updateValues: [] as any[],
}));

vi.mock('@/config', () => ({
  envConfigs: {
    app_url: 'https://mediaclaw.example',
  },
}));

vi.mock('@/modules/config/service', () => ({
  getAllConfigs: vi.fn(),
}));

vi.mock('@/lib/hash', () => ({
  getNonceStr: () => 'ABC',
  getUuid: () => 'relation-1',
}));

vi.mock('@/core/db', () => {
  const tx = {
    insert: vi.fn(() => ({
      values: (values: any) => {
        dbState.insertedRelation = values;
        return {
          returning: vi.fn(async () => [
            {
              ...values,
              hasFirstOrder: false,
              firstOrderNo: null,
              firstOrderAt: null,
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
        if (callIndex === 0) {
          return dbState.referrerAccount ? [dbState.referrerAccount] : [];
        }
        return dbState.existingRelation ? [dbState.existingRelation] : [];
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
  dbState.referrerAccount = {
    id: 'account-1',
    userId: 'referrer-1',
    inviteCode: 'MCREF',
    status: 'active',
  };
  dbState.existingRelation = null;
  dbState.selectCalls = 0;
  dbState.insertedRelation = null;
  dbState.updateValues = [];
}

describe('referral relation service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbState();
  });

  it('creates a relation and increments invitee count for a valid code', async () => {
    const result = await createReferralRelation({
      referralCode: ' mc-ref!! ',
      refereeId: 'invitee-1',
      refereeEmail: 'invitee@example.com',
    });

    expect(dbState.insertedRelation).toMatchObject({
      id: 'relation-1',
      referrerId: 'referrer-1',
      refereeId: 'invitee-1',
      referralCode: 'MCREF',
      status: 'active',
    });
    expect(dbState.updateValues).toHaveLength(1);
    expect(result).toMatchObject({
      id: 'relation-1',
      referrerId: 'referrer-1',
      refereeId: 'invitee-1',
      referralCode: 'MCREF',
    });
  });

  it('returns an existing relation instead of creating a duplicate', async () => {
    dbState.existingRelation = {
      id: 'existing-relation',
      referrerId: 'referrer-1',
      refereeId: 'invitee-1',
      referralCode: 'MCREF',
    };

    const result = await createReferralRelation({
      referralCode: 'MCREF',
      refereeId: 'invitee-1',
    });

    expect(result).toEqual(dbState.existingRelation);
    expect(dbState.insertedRelation).toBeNull();
    expect(dbState.updateValues).toHaveLength(0);
  });

  it('ignores self-referrals', async () => {
    dbState.referrerAccount.userId = 'invitee-1';

    const result = await createReferralRelation({
      referralCode: 'MCREF',
      refereeId: 'invitee-1',
    });

    expect(result).toBeNull();
    expect(dbState.insertedRelation).toBeNull();
    expect(dbState.updateValues).toHaveLength(0);
  });
});
