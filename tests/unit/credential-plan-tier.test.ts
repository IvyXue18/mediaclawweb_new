import { describe, expect, it } from 'vitest';

import { getCredentialPlanTier, getPricingProduct } from '@/config/pricing';

describe('credential plan tier', () => {
  it.each(['pro-1m', 'pro-monthly', 'pro-yearly'])(
    'classifies %s as personal',
    (productId) => {
      expect(getPricingProduct(productId)?.credentialTier).toBe('personal');
      expect(getCredentialPlanTier({ planCode: productId })).toBe('personal');
    }
  );

  it.each(['team-1m', 'team-monthly', 'team-yearly'])(
    'classifies %s as team',
    (productId) => {
      expect(getPricingProduct(productId)?.credentialTier).toBe('team');
      expect(getCredentialPlanTier({ planCode: productId })).toBe('team');
    }
  );

  it('keeps trial credentials outside paid renewal tiers', () => {
    expect(getCredentialPlanTier({ planCode: 'trial', maxBindings: 1 })).toBe(
      'trial'
    );
  });

  it('classifies legacy manually-issued credentials by binding count', () => {
    expect(getCredentialPlanTier({ planCode: 'formal', maxBindings: 1 })).toBe(
      'personal'
    );
    expect(getCredentialPlanTier({ planCode: 'formal', maxBindings: 3 })).toBe(
      'team'
    );
  });
});
