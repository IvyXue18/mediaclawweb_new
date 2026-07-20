import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getApplicableStarterDeduction,
  getStarterStatus,
  isPaidTrialCredential,
} from '@/modules/starter/service';

const mocks = vi.hoisted(() => ({
  selectResults: [] as any[][],
  getAllConfigs: vi.fn(),
}));

vi.mock('@/core/db', () => {
  function createSelectChain() {
    const chain: any = {
      from: () => chain,
      where: () => chain,
      orderBy: async () => mocks.selectResults.shift() || [],
      limit: async () => mocks.selectResults.shift() || [],
    };
    return chain;
  }

  return {
    db: () => ({
      select: () => createSelectChain(),
    }),
  };
});

vi.mock('@/modules/config/service', () => ({
  getAllConfigs: () => mocks.getAllConfigs(),
}));

const activePaidTrial = {
  id: 'paid-trial-1',
  code: 'ACT-PAID-0000',
  status: 'active',
  expiresAt: new Date('2026-07-23T00:00:00.000Z'),
  sourceOrderNo: 'STARTER-ORDER-1',
};

describe('9 yuan starter card rules', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-18T00:00:00.000Z'));
    mocks.selectResults = [];
    mocks.getAllConfigs.mockResolvedValue({});
  });

  it('allows an account with no trial and no starter order to purchase', async () => {
    mocks.selectResults = [[], []];

    await expect(getStarterStatus('user-1')).resolves.toMatchObject({
      eligible: true,
      reason: '',
      paidTrial: null,
      deductionAvailable: false,
      deductionCents: 900,
    });
  });

  it('rejects both legacy free-trial and paid-trial accounts', async () => {
    mocks.selectResults = [
      [
        {
          ...activePaidTrial,
          id: 'free-trial-1',
          sourceOrderNo: null,
        },
      ],
    ];
    await expect(getStarterStatus('user-free')).resolves.toMatchObject({
      eligible: false,
      reason: 'has_free_trial',
    });

    mocks.selectResults = [[activePaidTrial], []];
    await expect(getStarterStatus('user-paid')).resolves.toMatchObject({
      eligible: false,
      reason: 'has_paid_trial',
      deductionAvailable: true,
    });
  });

  it('rejects a new account when the browser claimed a legacy free trial', async () => {
    mocks.selectResults = [[], [{ userId: 'user-old' }]];

    await expect(
      getStarterStatus('user-new', 'browser-install-1')
    ).resolves.toMatchObject({
      eligible: false,
      reason: 'browser_already_used',
    });
  });

  it('rejects a new account when the browser bought a starter card', async () => {
    mocks.selectResults = [
      [],
      [],
      [
        {
          userId: 'user-old',
          status: 'paid',
          checkoutUrl: 'https://pay.example/STARTER-ORDER-OLD',
          createdAt: new Date('2026-07-17T00:00:00.000Z'),
        },
      ],
    ];

    await expect(
      getStarterStatus('user-new', 'browser-install-1')
    ).resolves.toMatchObject({
      eligible: false,
      reason: 'browser_already_used',
    });
  });

  it("ignores another account's stale unpaid browser checkout", async () => {
    mocks.selectResults = [
      [],
      [],
      [
        {
          userId: 'user-old',
          status: 'created',
          checkoutUrl: 'https://pay.example/STARTER-ORDER-OLD',
          createdAt: new Date('2026-07-17T23:00:00.000Z'),
        },
      ],
      [],
    ];

    await expect(
      getStarterStatus('user-new', 'browser-install-1')
    ).resolves.toMatchObject({
      eligible: true,
      reason: '',
    });
  });

  it('returns a reusable checkout while a starter order is pending', async () => {
    mocks.selectResults = [
      [],
      [
        {
          id: 'order-1',
          orderNo: 'STARTER-ORDER-1',
          status: 'pending',
          checkoutUrl: 'https://pay.example/STARTER-ORDER-1',
          createdAt: new Date('2026-07-17T23:50:00.000Z'),
        },
      ],
    ];

    await expect(getStarterStatus('user-1')).resolves.toMatchObject({
      eligible: false,
      reason: 'has_pending_order',
      pendingOrder: {
        orderNo: 'STARTER-ORDER-1',
        status: 'pending',
        checkoutUrl: 'https://pay.example/STARTER-ORDER-1',
      },
    });
  });

  it('allows a new checkout when the previous unpaid starter order expired', async () => {
    mocks.selectResults = [
      [],
      [
        {
          id: 'order-old',
          orderNo: 'STARTER-ORDER-OLD',
          status: 'created',
          checkoutUrl: 'https://pay.example/STARTER-ORDER-OLD',
          createdAt: new Date('2026-07-17T23:00:00.000Z'),
        },
      ],
    ];

    await expect(getStarterStatus('user-1')).resolves.toMatchObject({
      eligible: true,
      reason: '',
      pendingOrder: null,
    });
  });

  it('only exposes the deduction while the paid card is active and unused', async () => {
    mocks.selectResults = [[activePaidTrial], []];
    await expect(getApplicableStarterDeduction('user-1')).resolves.toBe(900);

    mocks.selectResults = [[activePaidTrial], [{ id: 'order-used' }]];
    await expect(getApplicableStarterDeduction('user-1')).resolves.toBe(0);

    mocks.selectResults = [
      [
        {
          ...activePaidTrial,
          expiresAt: new Date('2026-07-17T23:59:59.000Z'),
        },
      ],
    ];
    await expect(getApplicableStarterDeduction('user-1')).resolves.toBe(0);
  });

  it('distinguishes paid starter credentials from legacy free trials', () => {
    expect(
      isPaidTrialCredential({
        planCode: 'TRIAL',
        sourceOrderNo: 'STARTER-ORDER-1',
      })
    ).toBe(true);
    expect(
      isPaidTrialCredential({ planCode: 'trial', sourceOrderNo: null })
    ).toBe(false);
    expect(
      isPaidTrialCredential({
        planCode: 'pro-1m',
        sourceOrderNo: 'ORDER-1',
      })
    ).toBe(false);
  });
});
