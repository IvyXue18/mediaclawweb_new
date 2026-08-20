import { describe, expect, it } from 'vitest';

import { getPricingProduct, resolvePricingProduct } from '@/config/pricing';

describe('pricing catalog config overrides', () => {
  it('applies admin pricing_products amount overrides for canonical IDs', () => {
    const product = resolvePricingProduct('pro-yearly', {
      pricing_products: JSON.stringify({
        'pro-yearly': {
          amount: 1000,
          currency: 'CNY',
          credits: 1500,
          type: 'credential',
          duration_preset: '1y',
          max_bindings: 1,
          status: 'active',
        },
      }),
    });

    expect(product).toMatchObject({
      productId: 'pro-yearly',
      priceInCents: 1000,
      currency: 'cny',
      credits: 1500,
      creditsValidDays: 365,
      maxBindings: 1,
      status: 'active',
    });
  });

  it('resolves legacy underscore IDs against hyphenated admin config keys', () => {
    const product = resolvePricingProduct('pro_yearly', {
      pricing_products: JSON.stringify({
        'pro-yearly': {
          amount: 1000,
          currency: 'CNY',
          credits: 1500,
          type: 'credential',
          duration_preset: '1y',
          max_bindings: 1,
          status: 'active',
        },
      }),
    });

    expect(product).toMatchObject({
      productId: 'pro-yearly',
      priceInCents: 1000,
      currency: 'cny',
    });
  });

  it('keeps legacy underscore lookup working for direct catalog reads', () => {
    expect(getPricingProduct('pro_yearly')).toMatchObject({
      productId: 'pro-yearly',
      priceInCents: 29900,
    });
  });
});
