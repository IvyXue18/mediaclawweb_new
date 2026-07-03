import { POST as claimCredential } from '@/routes/api/user/credentials/claim';
import { POST as checkClaimStatus } from '@/routes/api/user/credentials/claim-status';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getCredentialClaimStatus: vi.fn(),
  claimCredentialForUser: vi.fn(),
  getClaimReasonMessage: vi.fn(),
}));

vi.mock('@/core/auth', () => ({
  getAuth: () => ({
    api: {
      getSession: (...args: any[]) => mocks.getSession(...args),
    },
  }),
}));

vi.mock('@/modules/credentials/service', () => ({
  getCredentialClaimStatus: (...args: any[]) =>
    mocks.getCredentialClaimStatus(...args),
  claimCredentialForUser: (...args: any[]) =>
    mocks.claimCredentialForUser(...args),
  getClaimReasonMessage: (...args: any[]) =>
    mocks.getClaimReasonMessage(...args),
  listCredentials: vi.fn(),
}));

function buildRequest(path: string, body: Record<string, unknown>) {
  return new Request(`https://mediaclaw.example${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('credential claim routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });
    mocks.getCredentialClaimStatus.mockResolvedValue({
      exists: true,
      claimable: true,
      isUnclaimedOwner: true,
      reason: 'claimable',
      status: 'active',
      ownerUserId: null,
    });
    mocks.claimCredentialForUser.mockResolvedValue({
      ok: true,
      data: {
        id: 'credential-1',
        code: 'ACT-CLAIM',
        ownerUserId: 'user-1',
      },
    });
    mocks.getClaimReasonMessage.mockImplementation((reason: string) => reason);
  });

  it('checks claimability for the old credential_code payload', async () => {
    const response = await checkClaimStatus({
      request: buildRequest('/api/user/credentials/claim-status', {
        credential_code: 'ACT-CLAIM',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        claimable: true,
        reason: 'claimable',
      },
    });
    expect(mocks.getCredentialClaimStatus).toHaveBeenCalledWith({
      code: 'ACT-CLAIM',
      currentUserId: 'user-1',
    });
  });

  it('validates missing claim status code before service lookup', async () => {
    const response = await checkClaimStatus({
      request: buildRequest('/api/user/credentials/claim-status', {}),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'credential code is required',
    });
    expect(mocks.getCredentialClaimStatus).not.toHaveBeenCalled();
  });

  it('claims a code using the old credential_code payload', async () => {
    const response = await claimCredential({
      request: buildRequest('/api/user/credentials/claim', {
        credential_code: 'ACT-CLAIM',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        id: 'credential-1',
        code: 'ACT-CLAIM',
        ownerUserId: 'user-1',
      },
    });
    expect(mocks.claimCredentialForUser).toHaveBeenCalledWith({
      code: 'ACT-CLAIM',
      currentUserId: 'user-1',
    });
  });

  it('returns stable reason data when a code is not claimable', async () => {
    mocks.claimCredentialForUser.mockResolvedValue({
      ok: false,
      reason: 'owned_by_other',
      status: {
        exists: true,
        claimable: false,
        isUnclaimedOwner: false,
        reason: 'owned_by_other',
        status: 'active',
        ownerUserId: 'user-2',
      },
    });
    mocks.getClaimReasonMessage.mockReturnValue(
      'this activation code is already bound to another account'
    );

    const response = await claimCredential({
      request: buildRequest('/api/user/credentials/claim', {
        credential_code: 'ACT-OTHER',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'this activation code is already bound to another account',
      data: {
        reason: 'owned_by_other',
        status: {
          claimable: false,
          ownerUserId: 'user-2',
        },
      },
    });
  });
});
