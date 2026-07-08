import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createCredential,
  ensureCredentialIssueCreditLedgerForOrder,
} from '@/modules/credentials/service';

const mocks = vi.hoisted(() => ({
  ownerRow: { id: 'user-1', email: 'buyer@example.com' } as any,
  txSelectResponses: [] as any[][],
  txInserts: [] as any[],
}));

vi.mock('@/lib/hash', () => ({
  getNonceStr: () => 'ABCD',
  getSnowId: () => 'TXN-ISSUE-1',
  getUuid: () => 'uuid-issue-1',
}));

vi.mock('@/core/db', () => {
  function ownerSelectChain() {
    const chain: any = {
      from: () => chain,
      where: () => chain,
      limit: async () => (mocks.ownerRow ? [mocks.ownerRow] : []),
    };
    return chain;
  }

  function txSelectChain() {
    const chain: any = {
      from: () => chain,
      leftJoin: () => chain,
      where: () => chain,
      limit: async () => mocks.txSelectResponses.shift() || [],
    };
    return chain;
  }

  const tx = {
    select: () => txSelectChain(),
    insert: () => ({
      values: (values: any) => {
        mocks.txInserts.push(values);
        if (values.code) {
          return {
            returning: async () => [{ ...values }],
          };
        }
        return Promise.resolve([values]);
      },
    }),
  };

  return {
    db: () => ({
      select: () => ownerSelectChain(),
      transaction: async (callback: any) => callback(tx),
    }),
  };
});

describe('credential issue credit ledger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ownerRow = { id: 'user-1', email: 'buyer@example.com' };
    mocks.txSelectResponses = [];
    mocks.txInserts = [];
  });

  it('creates a visible credit ledger row when a paid credential is issued', async () => {
    const result = await createCredential({
      code: 'ACT-ISSUE-0001',
      ownerEmail: 'buyer@example.com',
      sourceOrderNo: 'ORD-ISSUE-1',
      planCode: 'pro-yearly',
      durationPreset: '1y',
      maxBindings: 1,
      expiresAt: new Date('2027-07-08T15:59:59.999Z'),
      notes: 'paid issue from order ORD-ISSUE-1',
      totalCredits: 1500,
    });

    expect(result.code).toBe('ACT-ISSUE-0001');

    const ledger = mocks.txInserts.find(
      (item) => item.transactionType === 'credential_issue'
    );
    expect(ledger).toMatchObject({
      userId: 'user-1',
      userEmail: 'buyer@example.com',
      orderNo: 'ORD-ISSUE-1',
      transactionType: 'credential_issue',
      transactionScene: 'payment',
      credits: 1500,
      remainingCredits: 0,
      status: 'active',
      credentialCode: 'ACT-ISSUE-0001',
    });
    expect(JSON.parse(ledger.metadata)).toMatchObject({
      credentialId: 'uuid-issue-1',
      source: 'paid_credential_issue',
      orderNo: 'ORD-ISSUE-1',
      remainingBefore: 0,
      remainingAfter: 1500,
    });
  });

  it('backfills a missing issue ledger row idempotently for an existing paid order', async () => {
    mocks.txSelectResponses = [
      [
        {
          id: 'credential-1',
          code: 'ACT-ISSUE-0001',
          ownerUserId: 'user-1',
          ownerEmail: 'buyer@example.com',
          sourceOrderNo: 'ORD-ISSUE-1',
          expiresAt: new Date('2027-07-08T15:59:59.999Z'),
          totalCredits: 1500,
        },
      ],
      [],
    ];

    const result = await ensureCredentialIssueCreditLedgerForOrder({
      orderNo: 'ORD-ISSUE-1',
      credentialCode: 'ACT-ISSUE-0001',
      userId: 'user-1',
      userEmail: 'buyer@example.com',
      credits: 1500,
    });

    expect(result).toEqual({
      inserted: true,
      credentialCode: 'ACT-ISSUE-0001',
    });
    expect(
      mocks.txInserts.filter(
        (item) => item.transactionType === 'credential_issue'
      )
    ).toHaveLength(1);
  });
});
