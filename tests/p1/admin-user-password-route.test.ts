import { POST } from '@/routes/api/admin/users/$id/password';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  hasPermission: vi.fn(),
  hashPassword: vi.fn(),
  getUuid: vi.fn(),
  selectResults: [] as unknown[][],
  updatedValues: null as null | Record<string, unknown>,
  insertedValues: null as null | Record<string, unknown>,
}));

vi.mock('@/core/auth', () => ({
  getAuth: () => ({
    api: {
      getSession: (...args: any[]) => mocks.getSession(...args),
    },
  }),
}));

vi.mock('@/modules/rbac/service', () => ({
  hasPermission: (...args: any[]) => mocks.hasPermission(...args),
}));

vi.mock('better-auth/crypto', () => ({
  hashPassword: (...args: any[]) => mocks.hashPassword(...args),
}));

vi.mock('@/lib/hash', () => ({
  getUuid: () => mocks.getUuid(),
}));

vi.mock('@/core/db', () => ({
  db: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(mocks.selectResults.shift() || []),
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
    insert: () => ({
      values: (values: Record<string, unknown>) => {
        mocks.insertedValues = values;
        return Promise.resolve();
      },
    }),
  }),
}));

function buildRequest(body: Record<string, unknown>) {
  return new Request(
    'https://mediaclaw.example/api/admin/users/user-1/password',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

describe('/api/admin/users/$id/password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@example.com' },
    });
    mocks.hasPermission.mockResolvedValue(true);
    mocks.hashPassword.mockResolvedValue('new-password-hash');
    mocks.getUuid.mockReturnValue('account-new');
    mocks.selectResults = [[{ id: 'user-1' }], [{ id: 'account-1' }]];
    mocks.updatedValues = null;
    mocks.insertedValues = null;
  });

  it('requires admin permission', async () => {
    mocks.hasPermission.mockResolvedValue(false);

    const response = await POST({
      params: { id: 'user-1' },
      request: buildRequest({
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'Forbidden',
    });
    expect(mocks.hashPassword).not.toHaveBeenCalled();
  });

  it('updates an existing credential account password', async () => {
    const response = await POST({
      params: { id: 'user-1' },
      request: buildRequest({
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: { success: true },
    });
    expect(mocks.hashPassword).toHaveBeenCalledWith('new-password');
    expect(mocks.updatedValues).toEqual({ password: 'new-password-hash' });
    expect(mocks.insertedValues).toBeNull();
  });

  it('creates a credential account if the user has none', async () => {
    mocks.selectResults = [[{ id: 'user-1' }], []];

    const response = await POST({
      params: { id: 'user-1' },
      request: buildRequest({
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: { success: true },
    });
    expect(mocks.insertedValues).toEqual({
      id: 'account-new',
      accountId: 'user-1',
      providerId: 'credential',
      userId: 'user-1',
      password: 'new-password-hash',
    });
  });

  it('validates password confirmation before hashing', async () => {
    const response = await POST({
      params: { id: 'user-1' },
      request: buildRequest({
        newPassword: 'new-password',
        confirmPassword: 'different-password',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'Passwords do not match',
    });
    expect(mocks.hashPassword).not.toHaveBeenCalled();
  });
});
