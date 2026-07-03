import {
  isTrialCredential,
  shouldUseDirectButtonUrl,
  shouldValidateCustomCredential,
} from '@/themes/default/blocks/pricing.utils';
import { describe, expect, it } from 'vitest';

describe('pricing UI business rules', () => {
  it('uses a direct button URL only for free products', () => {
    expect(
      shouldUseDirectButtonUrl({
        amount: 0,
        button: { title: 'Install', url: '/download' } as any,
      })
    ).toBe(true);

    expect(
      shouldUseDirectButtonUrl({
        amount: 4900,
        button: { title: 'Buy', url: '/pricing' } as any,
      })
    ).toBe(false);
  });

  it('requires custom credential validation for renewals and credit packs', () => {
    expect(
      shouldValidateCustomCredential({
        purchaseMode: 'renew',
        isCreditsGroup: false,
        isCustomInput: true,
      })
    ).toBe(true);

    expect(
      shouldValidateCustomCredential({
        purchaseMode: 'new',
        isCreditsGroup: true,
        isCustomInput: true,
      })
    ).toBe(true);

    expect(
      shouldValidateCustomCredential({
        purchaseMode: 'new',
        isCreditsGroup: false,
        isCustomInput: true,
      })
    ).toBe(false);
  });

  it('derives trial credentials from planCode only', () => {
    expect(isTrialCredential({ planCode: 'trial' })).toBe(true);
    expect(isTrialCredential({ planCode: 'TRIAL' })).toBe(true);
    expect(isTrialCredential({ planCode: 'pro-1m' })).toBe(false);
    expect(isTrialCredential(null)).toBe(false);
  });
});
