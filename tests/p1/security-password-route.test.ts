import { POST } from '@/routes/api/user/security/password';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
  accountRow: null as null | { id: string; password: string | null },
  updatedValues: null as null | Record<string, unknown>,
}));

vi.mock('@/core/auth', () => ({
  getAuth: () => ({
    api: {
      getSession: (...args: any[]) => mocks.getSession(...args),
    },
  }),
}));

vi.mock('better-auth/crypto', () => ({
  verifyPassword: (...args: any[]) => mocks.verifyPassword(...args),
  hashPassword: (...args: any[]) => mocks.hashPassword(...args),
}));

vi.mock('@/core/db', () => ({
  db: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve(mocks.accountRow ? [mocks.accountRow] : []),
        }),
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => {
        mocks.updatedValues = values;
        return {
          where: () => Promise.resolve(),
        };
      },
    }),
  }),
}));

function buildRequest(body: Record<string, unknown>) {
  return new Request('https://mediaclaw.example/api/user/security/password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/user/security/password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.accountRow = { id: 'account-1', password: 'stored-password-hash' };
    mocks.updatedValues = null;
    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.hashPassword.mockResolvedValue('new-password-hash');
  });

  it('requires an authenticated user', async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await POST({
      request: buildRequest({
        password: 'old-password',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'Unauthorized',
    });
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
  });

  it('validates the new password confirmation before checking the hash', async () => {
    const response = await POST({
      request: buildRequest({
        password: 'old-password',
        newPassword: 'new-password',
        confirmPassword: 'different-password',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'Passwords do not match',
    });
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
  });

  it('rejects an incorrect current password', async () => {
    mocks.verifyPassword.mockResolvedValue(false);

    const response = await POST({
      request: buildRequest({
        password: 'wrong-password',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'Current password is incorrect',
    });
    expect(mocks.updatedValues).toBeNull();
  });

  it('updates the credential account password with better-auth hashing', async () => {
    const response = await POST({
      request: buildRequest({
        password: 'old-password',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: { success: true },
    });
    expect(mocks.verifyPassword).toHaveBeenCalledWith({
      hash: 'stored-password-hash',
      password: 'old-password',
    });
    expect(mocks.hashPassword).toHaveBeenCalledWith('new-password');
    expect(mocks.updatedValues).toEqual({ password: 'new-password-hash' });
  });
});
