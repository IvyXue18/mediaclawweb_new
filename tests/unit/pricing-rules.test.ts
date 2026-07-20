import {
  isTrialCredential,
  shouldUseDirectButtonUrl,
  shouldValidateCustomCredential,
} from '@/themes/default/blocks/pricing.utils';
import { describe, expect, it } from 'vitest';

import { resolvePricingProduct } from '@/config/pricing';

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

describe('starter product configuration', () => {
  it('uses safe defaults and keeps trial credits non-expiring', () => {
    const product = resolvePricingProduct('trial-starter', {});
    expect(product).toMatchObject({
      description: '全能体验卡',
      priceInCents: 900,
      durationDays: 5,
      credits: 50,
      grantPlanCode: 'trial',
      creditsNeverExpire: true,
    });
  });

  it('allows price, membership days and credits to be configured together', () => {
    const product = resolvePricingProduct('trial-starter', {
      pricing_products: JSON.stringify({
        'trial-starter': { amount: 1200, duration_days: 8, credits: 66 },
      }),
    });
    expect(product).toMatchObject({
      priceInCents: 1200,
      durationDays: 8,
      credits: 66,
    });
    expect(product?.creditsValidDays).toBe(0);
  });
});
