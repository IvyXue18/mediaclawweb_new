import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cancelReferralCommissionForOrder } from '@/modules/referral/service';

const dbState = vi.hoisted(() => ({
  commission: null as any,
  updateValues: [] as any[],
}));

vi.mock('@/config', () => ({
  envConfigs: {
    app_url: 'https://mediaclaw.example',
  },
}));

vi.mock('@/modules/config/service', () => ({
  getAllConfigs: vi.fn(),
}));

vi.mock('@/lib/hash', () => ({
  getNonceStr: () => 'ABC',
  getUuid: () => 'uuid-1',
}));

vi.mock('@/core/db', () => {
  const tx = {
    update: vi.fn(() => ({
      set: (values: any) => {
        dbState.updateValues.push(values);
        return {
          where: vi.fn(() => ({
            returning: vi.fn(async () => [
              {
                ...dbState.commission,
                ...values,
              },
            ]),
          })),
        };
      },
    })),
  };

  function selectChain() {
    const chain: any = {
      from: () => chain,
      where: () => chain,
      limit: async () => (dbState.commission ? [dbState.commission] : []),
    };
    return chain;
  }

  return {
    db: () => ({
      select: vi.fn(() => selectChain()),
      transaction: vi.fn(async (callback: any) => callback(tx)),
    }),
  };
});

function resetDbState() {
  dbState.commission = {
    id: 'commission-1',
    referrerUserId: 'referrer-1',
    orderNo: 'ORDER-REFUND-1',
    amount: 3000,
    status: 'pending',
    reason: 'first_order',
  };
  dbState.updateValues = [];
}

describe('referral commission cancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbState();
  });

  it('cancels pending commission and deducts referrer pending totals', async () => {
    const result = await cancelReferralCommissionForOrder(
      'ORDER-REFUND-1',
      'payment_refunded'
    );

    expect(dbState.updateValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'canceled',
          reason: 'first_order; canceled:payment_refunded',
        }),
        expect.objectContaining({
          pendingCommission: expect.anything(),
          totalCommission: expect.anything(),
        }),
      ])
    );
    expect(result).toMatchObject({
      id: 'commission-1',
      status: 'canceled',
    });
  });

  it('leaves settled commissions untouched', async () => {
    dbState.commission.status = 'settled';

    const result = await cancelReferralCommissionForOrder('ORDER-REFUND-1');

    expect(result).toEqual(dbState.commission);
    expect(dbState.updateValues).toHaveLength(0);
  });
});
