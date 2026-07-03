import {
  claimCredentialForUser,
  getClaimReasonMessage,
  getCredentialClaimStatus,
} from '@/app/api/user/credentials/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbState = vi.hoisted(() => ({
  selectQueue: [] as any[][],
  updateQueue: [] as any[][],
  updates: [] as any[],
}));

vi.mock('@/core/db', () => {
  function createSelectChain() {
    const chain: any = {
      from: () => chain,
      leftJoin: () => chain,
      where: () => chain,
      limit: async () => dbState.selectQueue.shift() || [],
    };
    return chain;
  }

  return {
    db: () => ({
      select: () => createSelectChain(),
      update: () => ({
        set: (values: any) => {
          dbState.updates.push(values);
          return {
            where: () => ({
              returning: async () => dbState.updateQueue.shift() || [],
            }),
          };
        },
      }),
    }),
  };
});

describe('credential claim flow', () => {
  beforeEach(() => {
    dbState.selectQueue = [];
    dbState.updateQueue = [];
    dbState.updates = [];
    delete process.env.CREDENTIAL_UNCLAIMED_OWNER_EMAIL;
  });

  it('marks active codes owned by the system placeholder account as claimable', async () => {
    dbState.selectQueue.push([
      {
        id: 'credential-1',
        code: 'ACT-UNCLAIMED',
        status: 'active',
        ownerUserId: 'system-user',
        ownerEmail: 'system+unclaimed-credential@mediaclaw.local',
      },
    ]);

    await expect(
      getCredentialClaimStatus({
        code: 'ACT-UNCLAIMED',
        currentUserId: 'user-1',
      })
    ).resolves.toMatchObject({
      exists: true,
      claimable: true,
      isUnclaimedOwner: true,
      reason: 'claimable',
      ownerUserId: 'system-user',
    });
  });

  it('distinguishes invalid, already-owned, and other-owned codes', async () => {
    dbState.selectQueue.push(
      [
        {
          id: 'credential-frozen',
          code: 'ACT-FROZEN',
          status: 'frozen',
          ownerUserId: null,
          ownerEmail: null,
        },
      ],
      [
        {
          id: 'credential-owned',
          code: 'ACT-OWNED',
          status: 'active',
          ownerUserId: 'user-1',
          ownerEmail: 'user@example.com',
        },
      ],
      [
        {
          id: 'credential-other',
          code: 'ACT-OTHER',
          status: 'active',
          ownerUserId: 'user-2',
          ownerEmail: 'other@example.com',
        },
      ]
    );

    await expect(
      getCredentialClaimStatus({
        code: 'ACT-FROZEN',
        currentUserId: 'user-1',
      })
    ).resolves.toMatchObject({
      claimable: false,
      reason: 'invalid_status',
      status: 'frozen',
    });
    await expect(
      getCredentialClaimStatus({
        code: 'ACT-OWNED',
        currentUserId: 'user-1',
      })
    ).resolves.toMatchObject({
      claimable: false,
      reason: 'already_owned',
    });
    await expect(
      getCredentialClaimStatus({
        code: 'ACT-OTHER',
        currentUserId: 'user-1',
      })
    ).resolves.toMatchObject({
      claimable: false,
      reason: 'owned_by_other',
    });
  });

  it('claims an active unowned code for the current user', async () => {
    dbState.selectQueue.push([
      {
        id: 'credential-1',
        code: 'ACT-CLAIM',
        status: 'active',
        ownerUserId: null,
        ownerEmail: null,
      },
    ]);
    dbState.updateQueue.push([
      {
        id: 'credential-1',
        code: 'ACT-CLAIM',
        ownerUserId: 'user-1',
      },
    ]);

    await expect(
      claimCredentialForUser({
        code: 'ACT-CLAIM',
        currentUserId: 'user-1',
      })
    ).resolves.toMatchObject({
      ok: true,
      data: {
        id: 'credential-1',
        code: 'ACT-CLAIM',
        ownerUserId: 'user-1',
      },
    });
    expect(dbState.updates[0]).toMatchObject({
      ownerUserId: 'user-1',
    });
  });

  it('does not mutate when a code is already owned by another account', async () => {
    dbState.selectQueue.push([
      {
        id: 'credential-other',
        code: 'ACT-OTHER',
        status: 'active',
        ownerUserId: 'user-2',
        ownerEmail: 'other@example.com',
      },
    ]);

    await expect(
      claimCredentialForUser({
        code: 'ACT-OTHER',
        currentUserId: 'user-1',
      })
    ).resolves.toMatchObject({
      ok: false,
      reason: 'owned_by_other',
    });
    expect(dbState.updates).toHaveLength(0);
  });

  it('keeps public-facing claim failure messages stable', () => {
    expect(getClaimReasonMessage('invalid_code')).toBe(
      'credential code is required'
    );
    expect(getClaimReasonMessage('not_found')).toBe(
      'activation code not found'
    );
    expect(getClaimReasonMessage('already_owned')).toBe(
      'activation code already belongs to current account'
    );
    expect(getClaimReasonMessage('owned_by_other')).toBe(
      'this activation code is already bound to another account'
    );
  });
});
