import { POST as requestWithdrawal } from '@/routes/api/referral/withdrawals';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  createWithdrawalRequest: vi.fn(),
}));

vi.mock('@/core/auth', () => ({
  getAuth: () => ({
    api: {
      getSession: (...args: any[]) => mocks.getSession(...args),
    },
  }),
}));

vi.mock('@/modules/referral/service', () => ({
  createWithdrawalRequest: (...args: any[]) =>
    mocks.createWithdrawalRequest(...args),
  getReferralOverview: vi.fn(),
}));

function buildRequest(body: Record<string, unknown>) {
  return new Request('https://mediaclaw.example/api/referral/withdrawals', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('referral withdrawal route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });
    mocks.createWithdrawalRequest.mockResolvedValue({
      id: 'withdrawal-1',
      userId: 'user-1',
      amount: 15000,
      status: 'pending',
    });
  });

  it('accepts the old contactSnapshot-only withdrawal payload', async () => {
    const response = await requestWithdrawal({
      request: buildRequest({ contactSnapshot: 'wechat: mediaclaw' }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        id: 'withdrawal-1',
        amount: 15000,
        status: 'pending',
      },
    });
    expect(mocks.createWithdrawalRequest).toHaveBeenCalledWith({
      userId: 'user-1',
      amount: undefined,
      currency: undefined,
      accountInfo: undefined,
      contactSnapshot: 'wechat: mediaclaw',
    });
  });
});
