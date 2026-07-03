import {
  calculatePartnerCheckoutAmount,
  isSupplierCurrentlyActive,
  normalizeChannelCode,
  normalizePartnerId,
} from '@/shared/models/partner';
import { describe, expect, it } from 'vitest';

describe('partner supplier rules', () => {
  it('normalizes partner ids for stable order and credential attribution', () => {
    expect(normalizePartnerId(' Supplier One! ')).toBe('supplier-one');
    expect(normalizePartnerId('MCN_2026')).toBe('mcn_2026');
    expect(normalizeChannelCode(' Supplier Buy! ')).toBe('supplier-buy');
  });

  it('calculates percentage supplier pricing by seat count', () => {
    expect(
      calculatePartnerCheckoutAmount({
        unitAmount: 9900,
        seats: 5,
        priceRuleType: 'percent_off',
        priceRuleValue: 20,
      })
    ).toBe(39600);
  });

  it('calculates fixed unit supplier pricing by seat count', () => {
    expect(
      calculatePartnerCheckoutAmount({
        unitAmount: 9900,
        seats: 5,
        priceRuleType: 'fixed_unit',
        priceRuleValue: 5900,
      })
    ).toBe(29500);
  });

  it('caps percentage supplier pricing at a free checkout floor', () => {
    expect(
      calculatePartnerCheckoutAmount({
        unitAmount: 9900,
        seats: 2,
        priceRuleType: 'percent_off',
        priceRuleValue: 120,
      })
    ).toBe(0);
  });

  it('treats supplier access as active only inside contract window', () => {
    const now = new Date('2026-06-17T00:00:00Z');

    expect(
      isSupplierCurrentlyActive(
        {
          status: 'active',
          contractStartAt: new Date('2026-01-01T00:00:00Z'),
          contractEndAt: new Date('2026-12-31T00:00:00Z'),
          deletedAt: null,
        } as any,
        now
      )
    ).toBe(true);

    expect(
      isSupplierCurrentlyActive(
        {
          status: 'disabled',
          contractStartAt: new Date('2026-01-01T00:00:00Z'),
          contractEndAt: null,
          deletedAt: null,
        } as any,
        now
      )
    ).toBe(false);

    expect(
      isSupplierCurrentlyActive(
        {
          status: 'active',
          contractStartAt: new Date('2026-07-01T00:00:00Z'),
          contractEndAt: null,
          deletedAt: null,
        } as any,
        now
      )
    ).toBe(false);

    expect(
      isSupplierCurrentlyActive(
        {
          status: 'active',
          contractStartAt: new Date('2026-01-01T00:00:00Z'),
          contractEndAt: new Date('2026-06-01T00:00:00Z'),
          deletedAt: null,
        } as any,
        now
      )
    ).toBe(false);
  });
});
