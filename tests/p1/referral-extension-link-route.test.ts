import { POST } from '@/routes/api/internal/referral/link';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getReferralExtensionLink: vi.fn(),
}));

vi.mock('@/config', () => ({
  envConfigs: {
    license_internal_token: 'test-internal-token',
  },
}));

vi.mock('@/modules/referral/service', () => ({
  getReferralExtensionLink: (...args: any[]) =>
    mocks.getReferralExtensionLink(...args),
}));

function buildRequest({
  token = 'test-internal-token',
  body = { userId: 'user-1' },
}: {
  token?: string;
  body?: Record<string, unknown>;
} = {}) {
  return new Request('https://mediaclaw.app/api/internal/referral/link', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-token': token,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/internal/referral/link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getReferralExtensionLink.mockResolvedValue({
      ok: true,
      inviteCode: 'ABC123',
      referralLink: 'https://mediaclaw.app/?ref=ABC123',
    });
  });

  it('rejects callers without the server-only token', async () => {
    const response = await POST({
      request: buildRequest({ token: 'wrong-token' }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      reason: 'unauthorized',
    });
    expect(mocks.getReferralExtensionLink).not.toHaveBeenCalled();
  });

  it('returns only the invite code and canonical referral link', async () => {
    const response = await POST({ request: buildRequest() });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: {
        inviteCode: 'ABC123',
        referralLink: 'https://mediaclaw.app/?ref=ABC123',
      },
    });
    expect(mocks.getReferralExtensionLink).toHaveBeenCalledWith('user-1');
  });

  it('preserves disabled and unclaimed business states', async () => {
    mocks.getReferralExtensionLink.mockResolvedValueOnce({
      ok: false,
      reason: 'referral_disabled',
      message: 'Referral program is not available',
    });
    const disabled = await POST({ request: buildRequest() });
    expect(disabled.status).toBe(409);
    await expect(disabled.json()).resolves.toMatchObject({
      ok: false,
      reason: 'referral_disabled',
    });

    mocks.getReferralExtensionLink.mockResolvedValueOnce({
      ok: false,
      reason: 'credential_unclaimed',
      message: 'Activation code is not linked to a website account',
    });
    const unclaimed = await POST({ request: buildRequest() });
    expect(unclaimed.status).toBe(400);
    await expect(unclaimed.json()).resolves.toMatchObject({
      ok: false,
      reason: 'credential_unclaimed',
    });
  });
});
