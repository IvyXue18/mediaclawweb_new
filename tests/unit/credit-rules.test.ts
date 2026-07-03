import {
  calculateCreditExpirationTime,
  getCreditDetailRetentionDays,
  getCreditSummaryCutoffMonth,
} from '@/shared/models/credit';
import { describe, expect, it, vi } from 'vitest';

describe('credit business rules', () => {
  it('keeps credits non-expiring when valid days is not positive', () => {
    expect(calculateCreditExpirationTime({ creditsValidDays: 0 })).toBeNull();
    expect(calculateCreditExpirationTime({ creditsValidDays: -1 })).toBeNull();
  });

  it('uses subscription current period end as the expiration anchor', () => {
    const currentPeriodEnd = new Date('2026-08-01T00:00:00.000Z');

    expect(
      calculateCreditExpirationTime({
        creditsValidDays: 30,
        currentPeriodEnd,
      })?.toISOString()
    ).toBe(currentPeriodEnd.toISOString());
  });

  it('uses configured retention days and falls back to 90 days', () => {
    expect(
      getCreditDetailRetentionDays({ credit_detail_retention_days: '30' })
    ).toBe(30);
    expect(
      getCreditDetailRetentionDays({ credit_detail_retention_days: '-1' })
    ).toBe(90);
    expect(
      getCreditDetailRetentionDays({ credit_detail_retention_days: 'abc' })
    ).toBe(90);
  });

  it('normalizes the summary cutoff to the first day of the UTC month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-16T12:00:00.000Z'));

    expect(getCreditSummaryCutoffMonth(30).toISOString()).toBe(
      '2026-05-01T00:00:00.000Z'
    );

    vi.useRealTimers();
  });
});
