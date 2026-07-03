import { POST } from '@/app/api/internal/credential/consume/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixedDate = new Date('2026-06-16T08:00:00.000Z');

const dbState = vi.hoisted(() => ({
  hasBizNo: false,
  summary: null as any,
  duplicate: null as any,
  owner: { email: 'owner@example.com' } as any,
  selectCalls: 0,
  updatedValues: [] as any[],
  insertedValues: [] as any[],
}));

vi.mock('@/config', () => ({
  envConfigs: {
    auth_secret: 'fallback-secret',
    license_internal_token: 'test-token',
  },
}));

vi.mock('@/shared/lib/hash', () => ({
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

        if (dbState.hasBizNo && callIndex === 1) {
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
  dbState.duplicate = null;
  dbState.owner = { email: 'owner@example.com' };
  dbState.selectCalls = 0;
  dbState.updatedValues = [];
  dbState.insertedValues = [];
}

function buildRequest({
  token = 'test-token',
  body,
}: {
  token?: string;
  body: Record<string, any>;
}) {
  return new Request('http://localhost/api/internal/credential/consume', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-token': token,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/internal/credential/consume', () => {
  beforeEach(() => {
    resetDbState();
  });

  it('rejects requests without the internal token', async () => {
    const response = await POST(
      buildRequest({
        token: 'wrong-token',
        body: { credential_code: 'ACT-TEST-TEST-TEST', credits: 1 },
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: 'Unauthorized',
    });
  });

  it('validates required credential code and positive credits before DB writes', async () => {
    const response = await POST(
      buildRequest({
        body: { credential_code: '', credits: 1 },
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: 'credential_code is required',
    });
    expect(dbState.updatedValues).toHaveLength(0);
    expect(dbState.insertedValues).toHaveLength(0);
  });

  it('consumes credential credits and records an idempotent transaction number', async () => {
    dbState.hasBizNo = true;
    dbState.summary = {
      id: 'summary-1',
      credentialCode: 'ACT-TEST-TEST-TEST',
      userId: 'user-1',
      orderNo: 'order-1',
      totalCredits: 100,
      usedCredits: 20,
      status: 'active',
      activatedAt: null,
    };

    const response = await POST(
      buildRequest({
        body: {
          credential_code: 'ACT-TEST-TEST-TEST',
          credits: 30,
          scene: 'account_monitor',
          description: 'monitor consume',
          biz_no: 'monitor-job-1',
          metadata: { source: 'test' },
        },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        transactionNo: 'credential_consume:user-1:monitor-job-1',
        credentialCode: 'ACT-TEST-TEST-TEST',
        consumedCredits: 30,
        remainingCredits: 50,
      },
    });

    expect(dbState.updatedValues[0]).toMatchObject({
      usedCredits: 50,
      status: 'active',
    });
    expect(dbState.insertedValues[0]).toMatchObject({
      id: 'uuid-generated',
      userId: 'user-1',
      userEmail: 'owner@example.com',
      orderNo: 'order-1',
      transactionNo: 'credential_consume:user-1:monitor-job-1',
      transactionType: 'consume',
      transactionScene: 'account_monitor',
      credits: -30,
      remainingCredits: 0,
      description: 'monitor consume',
      status: 'active',
      credentialCode: 'ACT-TEST-TEST-TEST',
    });
    expect(JSON.parse(dbState.insertedValues[0].metadata)).toMatchObject({
      source: 'test',
      bizNo: 'monitor-job-1',
      remainingBefore: 80,
      remainingAfter: 50,
      credentialCreditId: 'summary-1',
    });
  });

  it('returns the existing consume record for repeated biz_no requests', async () => {
    dbState.hasBizNo = true;
    dbState.summary = {
      id: 'summary-1',
      credentialCode: 'ACT-TEST-TEST-TEST',
      userId: 'user-1',
      orderNo: 'order-1',
      totalCredits: 100,
      usedCredits: 20,
      status: 'active',
      activatedAt: fixedDate,
    };
    dbState.duplicate = {
      transactionNo: 'credential_consume:user-1:monitor-job-1',
      createdAt: fixedDate,
      credits: -30,
    };

    const response = await POST(
      buildRequest({
        body: {
          credential_code: 'ACT-TEST-TEST-TEST',
          credits: 30,
          biz_no: 'monitor-job-1',
        },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        transactionNo: 'credential_consume:user-1:monitor-job-1',
        consumedCredits: 30,
        remainingCredits: 80,
      },
    });
    expect(dbState.updatedValues).toHaveLength(0);
    expect(dbState.insertedValues).toHaveLength(0);
  });

  it('fails without mutating when remaining credits are insufficient', async () => {
    dbState.summary = {
      id: 'summary-1',
      credentialCode: 'ACT-TEST-TEST-TEST',
      userId: 'user-1',
      orderNo: 'order-1',
      totalCredits: 10,
      usedCredits: 5,
      status: 'active',
      activatedAt: null,
    };

    const response = await POST(
      buildRequest({
        body: {
          credential_code: 'ACT-TEST-TEST-TEST',
          credits: 30,
        },
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: 'insufficient credential credits: 5 < 30',
    });
    expect(dbState.updatedValues).toHaveLength(0);
    expect(dbState.insertedValues).toHaveLength(0);
  });
});
