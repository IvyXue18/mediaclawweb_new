import { POST as consumeCredential } from '@/routes/api/internal/credential/consume';
import { POST as validateCredential } from '@/routes/api/user/validate-credential';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixedDate = new Date('2026-06-18T08:00:00.000Z');

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getCredentialByCode: vi.fn(),
}));

const dbState = vi.hoisted(() => ({
  hasBizNo: false,
  summary: null as any,
  parentCredential: null as any,
  duplicate: null as any,
  owner: { email: 'owner@example.com' } as any,
  selectCalls: 0,
  updatedValues: [] as any[],
  insertedValues: [] as any[],
}));

vi.mock('@/core/auth', () => ({
  getAuth: () => ({
    api: {
      getSession: (...args: any[]) => mocks.getSession(...args),
    },
  }),
}));

vi.mock('@/modules/credentials/service', () => ({
  getCredentialByCode: (...args: any[]) => mocks.getCredentialByCode(...args),
}));

vi.mock('@/config', () => ({
  envConfigs: {
    auth_secret: 'fallback-secret',
    license_internal_token: 'test-token',
  },
}));

vi.mock('@/lib/hash', () => ({
  getSnowId: () => 'snow-generated',
  getUuid: () => 'uuid-generated',
}));

vi.mock('@/core/db', () => {
  function createSelectChain() {
    const callIndex = dbState.selectCalls;
    dbState.selectCalls += 1;

    const chain: any = {
      from: () => chain,
      where: () => chain,
      limit: () => {
        if (callIndex === 0) {
          return {
            for: async () => (dbState.summary ? [dbState.summary] : []),
          };
        }

        if (callIndex === 1) {
          return Promise.resolve(
            dbState.parentCredential ? [dbState.parentCredential] : []
          );
        }

        if (dbState.hasBizNo && callIndex === 2) {
          return Promise.resolve(dbState.duplicate ? [dbState.duplicate] : []);
        }

        return Promise.resolve(dbState.owner ? [dbState.owner] : []);
      },
    };

    return chain;
  }

  const tx = {
    select: vi.fn(() => createSelectChain()),
    update: vi.fn(() => ({
      set: (values: any) => {
        dbState.updatedValues.push(values);
        return { where: vi.fn(async () => []) };
      },
    })),
    insert: vi.fn(() => ({
      values: (values: any) => {
        dbState.insertedValues.push(values);
        return {
          returning: vi.fn(async () => [
            {
              transactionNo: values.transactionNo,
              createdAt: fixedDate,
            },
          ]),
        };
      },
    })),
  };

  return {
    db: () => ({
      transaction: vi.fn(async (callback: any) => callback(tx)),
    }),
  };
});

function resetDbState() {
  dbState.hasBizNo = false;
  dbState.summary = null;
  dbState.parentCredential = null;
  dbState.duplicate = null;
  dbState.owner = { email: 'owner@example.com' };
  dbState.selectCalls = 0;
  dbState.updatedValues = [];
  dbState.insertedValues = [];
}

function buildValidateRequest(body: Record<string, unknown>) {
  return new Request('https://mediaclaw.example/api/user/validate-credential', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function buildConsumeRequest({
  token = 'test-token',
  body,
}: {
  token?: string;
  body: Record<string, unknown>;
}) {
  return new Request(
    'https://mediaclaw.example/api/internal/credential/consume',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-token': token,
      },
      body: JSON.stringify(body),
    }
  );
}

describe('credential runtime routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbState();
    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });
  });

  it('validates the old credential_code payload for the current owner', async () => {
    mocks.getCredentialByCode.mockResolvedValue({
      id: 'cred-1',
      code: 'ACT-OWNED',
      ownerUserId: 'user-1',
      status: 'active',
    });

    const response = await validateCredential({
      request: buildValidateRequest({ credential_code: 'ACT-OWNED' }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        status: 'owned',
        valid: true,
        code: 'ACT-OWNED',
      },
    });
    expect(mocks.getCredentialByCode).toHaveBeenCalledWith('ACT-OWNED');
  });

  it('rejects another owner credential during plugin validation', async () => {
    mocks.getCredentialByCode.mockResolvedValue({
      id: 'cred-2',
      code: 'ACT-OTHER',
      ownerUserId: 'user-2',
      status: 'active',
    });

    const response = await validateCredential({
      request: buildValidateRequest({ credential_code: 'ACT-OTHER' }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'this activation code is already bound to another account',
    });
  });

  it('rejects frozen credentials during plugin validation', async () => {
    mocks.getCredentialByCode.mockResolvedValue({
      id: 'cred-3',
      code: 'ACT-FROZEN',
      ownerUserId: 'user-1',
      status: 'frozen',
    });

    const response = await validateCredential({
      request: buildValidateRequest({ credential_code: 'ACT-FROZEN' }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'credential is frozen',
    });
  });

  it('rejects frozen parent credentials before internal credit consumption', async () => {
    dbState.summary = {
      id: 'summary-1',
      credentialCode: 'ACT-FROZEN',
      userId: 'user-1',
      totalCredits: 100,
      usedCredits: 10,
      status: 'active',
    };
    dbState.parentCredential = {
      ownerUserId: 'user-1',
      status: 'frozen',
      deletedAt: null,
    };

    const response = await consumeCredential({
      request: buildConsumeRequest({
        body: { credential_code: 'ACT-FROZEN', credits: 1 },
      }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: 'credential is frozen',
    });
    expect(dbState.updatedValues).toHaveLength(0);
    expect(dbState.insertedValues).toHaveLength(0);
  });

  it('consumes credits only after the parent credential is active', async () => {
    dbState.hasBizNo = true;
    dbState.summary = {
      id: 'summary-1',
      credentialCode: 'ACT-ACTIVE',
      userId: 'user-1',
      orderNo: 'order-1',
      totalCredits: 100,
      usedCredits: 20,
      status: 'active',
      activatedAt: null,
    };
    dbState.parentCredential = {
      ownerUserId: 'user-1',
      status: 'active',
      deletedAt: null,
    };

    const response = await consumeCredential({
      request: buildConsumeRequest({
        body: {
          credential_code: 'ACT-ACTIVE',
          credits: 30,
          scene: 'account_monitor',
          description: 'monitor consume',
          biz_no: 'monitor-job-1',
        },
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        transactionNo: 'credential_consume:user-1:monitor-job-1',
        credentialCode: 'ACT-ACTIVE',
        consumedCredits: 30,
        remainingCredits: 50,
      },
    });
    expect(dbState.updatedValues).toHaveLength(1);
    expect(dbState.insertedValues).toHaveLength(1);
  });
});
