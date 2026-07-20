import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createCheckout,
  DEDUCTION_RESERVATION_CONFLICT_CODE,
} from '@/modules/payment/service';

const mocks = vi.hoisted(() => ({
  rows: [] as any[],
  sequence: 0,
  createPayment: vi.fn(),
  getAllConfigs: vi.fn(),
}));

vi.mock('@/config', () => ({
  envConfigs: {
    app_url: 'https://mediaclaw.example',
    database_provider: 'sqlite',
    zpay_pid: 'test-pid',
    zpay_pkey: 'test-key',
  },
}));

vi.mock('@/lib/hash', () => ({
  getUniSeq: () => `ORDER-${++mocks.sequence}`,
  getUuid: () => `UUID-${mocks.sequence}`,
  getSnowId: () => `SNOW-${mocks.sequence}`,
}));

vi.mock('@/modules/config/service', () => ({
  getAllConfigs: (...args: any[]) => mocks.getAllConfigs(...args),
}));

vi.mock('@/core/payment', () => ({
  PaymentManager: class {
    addProvider() {}
    getDefaultProvider() {
      return { name: 'zpay' };
    }
    createPayment(input: any) {
      return mocks.createPayment(input);
    }
    getProvider() {
      return null;
    }
  },
  AlipayProvider: class {},
  CreemProvider: class {},
  StripeProvider: class {},
  WechatPayProvider: class {},
  ZpayProvider: class {},
}));

vi.mock('@/core/db', () => ({
  db: () => ({
    insert: () => ({
      values: async (values: any) => {
        const reservationKey = values.deductionReservationKey;
        if (
          reservationKey &&
          mocks.rows.some(
            (row) => row.deductionReservationKey === reservationKey
          )
        ) {
          throw Object.assign(
            new Error(
              'duplicate key violates unique constraint "uq_order_deduction_reservation"'
            ),
            {
              code: '23505',
              constraint: 'uq_order_deduction_reservation',
            }
          );
        }
        mocks.rows.push({ ...values });
        return [values];
      },
    }),
    update: () => ({
      set: (values: any) => ({
        where: async () => {
          const row = mocks.rows.at(-1);
          if (row) Object.assign(row, values);
          return row ? [row] : [];
        },
      }),
    }),
  }),
}));

function checkoutInput() {
  return {
    userId: 'user-1',
    userEmail: 'user@example.com',
    productName: 'MediaClaw Pro',
    planName: 'Pro',
    credits: 100,
    discountCode: 'trial_deduction',
    discountAmount: 900,
    deductionReservationKey: 'user-1:trial_deduction',
    paymentOrder: {
      productId: 'pro-1m',
      price: { amount: 4000, currency: 'cny' },
      type: 'one-time' as const,
      description: 'Pro monthly',
      successUrl: 'https://mediaclaw.example/settings/payments',
      cancelUrl: 'https://mediaclaw.example/pricing',
    },
  };
}

describe('starter deduction checkout concurrency', () => {
  beforeEach(() => {
    mocks.rows = [];
    mocks.sequence = 0;
    mocks.getAllConfigs.mockResolvedValue({
      default_payment_provider: 'zpay',
      zpay_enabled: 'true',
      zpay_pid: 'test-pid',
      zpay_pkey: 'test-key',
    });
    mocks.createPayment.mockImplementation(async ({ order }: any) => {
      await Promise.resolve();
      return {
        provider: 'zpay',
        checkoutInfo: {
          sessionId: order.orderNo,
          checkoutUrl: `https://pay.example/${order.orderNo}`,
        },
        checkoutResult: { code: 1 },
      };
    });
  });

  it('allows only one of two simultaneous requests to reserve the deduction', async () => {
    const results = await Promise.allSettled([
      createCheckout(checkoutInput()),
      createCheckout(checkoutInput()),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
      code: DEDUCTION_RESERVATION_CONFLICT_CODE,
    });
    expect(mocks.createPayment).toHaveBeenCalledTimes(1);
    expect(mocks.rows).toHaveLength(1);
    expect(mocks.rows[0]).toMatchObject({
      userId: 'user-1',
      discountCode: 'trial_deduction',
      discountAmount: 900,
      deductionReservationKey: 'user-1:trial_deduction',
      status: 'created',
    });
  });

  it('releases the reservation when provider checkout creation fails', async () => {
    mocks.createPayment.mockRejectedValueOnce(
      new Error('provider unavailable')
    );

    await expect(createCheckout(checkoutInput())).rejects.toThrow(
      'provider unavailable'
    );
    expect(mocks.rows[0]).toMatchObject({
      status: 'failed',
      deductionReservationKey: null,
    });

    mocks.createPayment.mockImplementationOnce(async ({ order }: any) => ({
      provider: 'zpay',
      checkoutInfo: {
        sessionId: order.orderNo,
        checkoutUrl: `https://pay.example/${order.orderNo}`,
      },
      checkoutResult: { code: 1 },
    }));

    await expect(createCheckout(checkoutInput())).resolves.toMatchObject({
      provider: 'zpay',
    });
    expect(mocks.rows).toHaveLength(2);
    expect(mocks.rows[1]).toMatchObject({
      status: 'created',
      deductionReservationKey: 'user-1:trial_deduction',
    });
  });
});
