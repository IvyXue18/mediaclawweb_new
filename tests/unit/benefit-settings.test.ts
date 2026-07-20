import { describe, expect, it } from 'vitest';

import { resolvePricingProduct } from '@/config/pricing';
import { getBenefitRewardConfigFromConfigs } from '@/modules/benefits/service';
import { getSettings } from '@/modules/config/settings';

describe('current benefit settings', () => {
  it('exposes only the current starter-card and extension reward fields', () => {
    const settings = getSettings();
    const benefitNames = settings
      .filter((setting) => setting.tab === 'benefits')
      .map((setting) => setting.name);

    expect(benefitNames).toEqual([
      'benefit_starter_card_enabled',
      'benefit_starter_card_price_cents',
      'benefit_starter_card_duration_days',
      'benefit_starter_card_credits',
      'benefit_starter_survey_enabled',
      'benefit_starter_survey_bonus_days',
      'benefit_experience_feedback_enabled',
      'benefit_experience_feedback_duration_days',
      'benefit_experience_feedback_credits',
    ]);
    expect(benefitNames.some((name) => name.includes('_new_'))).toBe(false);
    expect(benefitNames).not.toContain(
      'benefit_channel_survey_existing_credits'
    );
  });

  it('applies dedicated starter-card settings without pricing JSON', () => {
    const product = resolvePricingProduct('trial-starter', {
      benefit_starter_card_enabled: 'false',
      benefit_starter_card_price_cents: '1200',
      benefit_starter_card_duration_days: '7',
      benefit_starter_card_credits: '80',
    });

    expect(product).toMatchObject({
      status: 'inactive',
      priceInCents: 1200,
      durationDays: 7,
      credits: 80,
    });
  });

  it('makes dedicated starter-card settings override legacy pricing JSON', () => {
    const product = resolvePricingProduct('trial-starter', {
      pricing_products: JSON.stringify({
        'trial-starter': { amount: 600, credits: 20, duration_days: 3 },
      }),
      benefit_starter_card_price_cents: '900',
      benefit_starter_card_duration_days: '5',
      benefit_starter_card_credits: '50',
    });

    expect(product).toMatchObject({
      priceInCents: 900,
      durationDays: 5,
      credits: 50,
    });
  });

  it('prefers new reward keys while retaining legacy fallback values', () => {
    const current = getBenefitRewardConfigFromConfigs({
      benefit_starter_survey_enabled: 'false',
      benefit_starter_survey_bonus_days: '4',
      benefit_experience_feedback_duration_days: '6',
      benefit_experience_feedback_credits: '12',
      benefit_channel_survey_existing_duration_days: '2',
      benefit_experience_feedback_existing_duration_days: '3',
    });
    expect(current.channel_survey).toMatchObject({
      enabled: false,
      existingCredential: { durationDays: 4, credits: 0 },
    });
    expect(current.experience_feedback.existingCredential).toEqual({
      durationDays: 6,
      credits: 12,
    });

    const legacy = getBenefitRewardConfigFromConfigs({
      benefit_channel_survey_enabled: 'true',
      benefit_channel_survey_existing_duration_days: '3',
      benefit_channel_survey_existing_credits: '99',
      benefit_experience_feedback_existing_duration_days: '4',
      benefit_experience_feedback_existing_credits: '8',
    });
    expect(legacy.channel_survey.existingCredential).toEqual({
      durationDays: 3,
      credits: 0,
    });
    expect(legacy.experience_feedback.existingCredential).toEqual({
      durationDays: 4,
      credits: 8,
    });
  });
});
