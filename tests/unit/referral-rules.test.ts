import {
  applyDiscount,
  shouldGrantReferralCommissionByProductType,
} from '@/shared/services/referral';
import { describe, expect, it } from 'vitest';

describe('referral business rules', () => {
  it('always grants commission for a first order', () => {
    expect(
      shouldGrantReferralCommissionByProductType({
        isFirstOrder: true,
        productType: 'credits_only',
      })
    ).toBe(true);
  });

  it('does not grant renewal commission for credit-only products', () => {
    expect(
      shouldGrantReferralCommissionByProductType({
        isFirstOrder: false,
        productType: 'credits_only',
      })
    ).toBe(false);

    expect(
      shouldGrantReferralCommissionByProductType({
        isFirstOrder: false,
        productType: 'credential',
      })
    ).toBe(true);
  });

  it('applies invitee discounts only for valid percentage rates', () => {
    expect(applyDiscount(10000, 20)).toBe(8000);
    expect(applyDiscount(10000, 0)).toBe(10000);
    expect(applyDiscount(10000, 100)).toBe(10000);
    expect(applyDiscount(10000, -5)).toBe(10000);
  });
});
