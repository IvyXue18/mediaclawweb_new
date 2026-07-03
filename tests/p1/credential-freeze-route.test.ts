import { POST as updateCredential } from '@/routes/api/user/credentials/$id';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  freezeCredentialByIdForOwner: vi.fn(),
}));

vi.mock('@/core/auth', () => ({
  getAuth: () => ({
    api: {
      getSession: (...args: any[]) => mocks.getSession(...args),
    },
  }),
}));

vi.mock('@/modules/credentials/service', () => ({
  getCredentialById: vi.fn(),
  listCredentials: vi.fn(),
  freezeCredentialByIdForOwner: (...args: any[]) =>
    mocks.freezeCredentialByIdForOwner(...args),
}));

function buildRequest(body: Record<string, unknown>) {
  return new Request('https://mediaclaw.example/api/user/credentials/cred-1', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('credential owner freeze route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });
    mocks.freezeCredentialByIdForOwner.mockResolvedValue({
      id: 'cred-1',
      code: 'ACT-FREEZE',
      ownerUserId: 'user-1',
      status: 'frozen',
    });
  });

  it('freezes only through the old owner action payload', async () => {
    const response = await updateCredential({
      request: buildRequest({ action: 'freeze' }),
      params: { id: 'cred-1' },
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        id: 'cred-1',
        status: 'frozen',
      },
    });
    expect(mocks.freezeCredentialByIdForOwner).toHaveBeenCalledWith({
      credentialId: 'cred-1',
      ownerUserId: 'user-1',
    });
  });

  it('rejects unsupported owner credential actions before mutation', async () => {
    const response = await updateCredential({
      request: buildRequest({ action: 'delete' }),
      params: { id: 'cred-1' },
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'Unsupported action',
    });
    expect(mocks.freezeCredentialByIdForOwner).not.toHaveBeenCalled();
  });

  it('returns a not-found envelope when the owner-scoped update misses', async () => {
    mocks.freezeCredentialByIdForOwner.mockResolvedValue(null);

    const response = await updateCredential({
      request: buildRequest({ action: 'freeze' }),
      params: { id: 'cred-1' },
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'Credential not found',
    });
  });
});
