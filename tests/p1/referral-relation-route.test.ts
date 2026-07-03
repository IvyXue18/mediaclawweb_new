import {
  POST as createRelation,
  GET as getRelations,
} from '@/routes/api/referral/relations';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  createReferralRelation: vi.fn(),
  getOrCreateReferralAccount: vi.fn(),
  listReferralRelations: vi.fn(),
}));

vi.mock('@/core/auth', () => ({
  getAuth: () => ({
    api: {
      getSession: (...args: any[]) => mocks.getSession(...args),
    },
  }),
}));

vi.mock('@/modules/referral/service', () => ({
  createReferralRelation: (...args: any[]) =>
    mocks.createReferralRelation(...args),
  getOrCreateReferralAccount: (...args: any[]) =>
    mocks.getOrCreateReferralAccount(...args),
  listReferralRelations: (...args: any[]) =>
    mocks.listReferralRelations(...args),
}));

function buildRequest(path: string, body?: Record<string, unknown>) {
  return new Request(`https://mediaclaw.example${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('referral relation route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });
    mocks.getOrCreateReferralAccount.mockResolvedValue({
      userId: 'user-1',
      inviteCode: 'MCUSER1',
    });
    mocks.listReferralRelations.mockResolvedValue({
      items: [{ id: 'relation-1', refereeEmail: 'invitee@example.com' }],
      total: 1,
    });
    mocks.createReferralRelation.mockResolvedValue({
      id: 'relation-1',
      referrerId: 'referrer-1',
      refereeId: 'user-1',
      referralCode: 'MCREF',
    });
  });

  it('returns paged invitation records with the invite code', async () => {
    const response = await getRelations({
      request: buildRequest('/api/referral/relations?page=2&pageSize=5'),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        inviteCode: 'MCUSER1',
        items: [{ id: 'relation-1' }],
        total: 1,
      },
    });
    expect(mocks.listReferralRelations).toHaveBeenCalledWith({
      userId: 'user-1',
      page: 2,
      pageSize: 5,
    });
  });

  it('accepts old and new referral-code payload spellings', async () => {
    const response = await createRelation({
      request: buildRequest('/api/referral/relations', {
        referral_code: 'MCREF',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        relation: {
          id: 'relation-1',
          referralCode: 'MCREF',
        },
      },
    });
    expect(mocks.createReferralRelation).toHaveBeenCalledWith({
      referralCode: 'MCREF',
      refereeId: 'user-1',
      refereeEmail: 'user@example.com',
    });
  });
});
