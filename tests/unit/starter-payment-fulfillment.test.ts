import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveCredentialIssueSpec } from '@/modules/payment/service';

function order(overrides: Record<string, unknown> = {}) {
  return {
    productId: 'pro-1m',
    paymentInterval: 'month',
    creditsValidDays: 30,
    priceRuleSnapshot: null,
    ...overrides,
  } as any;
}

describe('paid starter-card credential fulfillment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-18T08:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('issues a five-day trial credential while keeping its credits non-expiring', () => {
    const spec = resolveCredentialIssueSpec(
      order({
        productId: 'trial-starter',
        creditsValidDays: 0,
        priceRuleSnapshot: JSON.stringify({
          planCode: 'trial',
          durationDays: 5,
          creditsNeverExpire: true,
          maxBindings: 1,
        }),
      })
    );

    expect(spec).toMatchObject({
      planCode: 'trial',
      durationPreset: 'trial',
      maxBindings: 1,
      creditsNeverExpire: true,
    });
    expect(spec.expiresAt.getTime()).toBeGreaterThan(
      new Date('2026-07-23T00:00:00.000Z').getTime()
    );
    expect(spec.expiresAt.getTime()).toBeLessThanOrEqual(
      new Date('2026-07-24T00:00:00.000Z').getTime()
    );
  });

  it('keeps regular paid-plan issuance behavior unchanged', () => {
    const spec = resolveCredentialIssueSpec(order());

    expect(spec).toMatchObject({
      planCode: 'pro-1m',
      durationPreset: 'monthly',
      maxBindings: 1,
      creditsNeverExpire: false,
    });
  });
});
