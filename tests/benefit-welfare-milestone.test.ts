import { buildWelfareFeedbackMilestone } from '@/shared/models/benefit';
import { describe, expect, it } from 'vitest';

describe('buildWelfareFeedbackMilestone', () => {
  it('does not allow website feedback reward before all extension milestones are met', () => {
    const milestone = buildWelfareFeedbackMilestone({
      coreCaptureSuccessCount: 5,
      exportOrCopySuccessCount: 0,
      syncSuccessCount: 0,
      highValueClickCount: 4,
      failureStreak: 0,
    });

    expect(milestone).toMatchObject({
      eligible: false,
      coreReady: true,
      outputReady: false,
      highValueReady: false,
      exportOrSyncSuccessCount: 0,
      highValueClickCount: 4,
    });
  });

  it('requires five combined export or sync successes', () => {
    const milestone = buildWelfareFeedbackMilestone({
      coreCaptureSuccessCount: 5,
      exportOrCopySuccessCount: 2,
      syncSuccessCount: 3,
      highValueClickCount: 5,
      failureStreak: 0,
    });

    expect(milestone).toMatchObject({
      eligible: true,
      outputReady: true,
      exportOrSyncSuccessCount: 5,
    });
  });

  it('blocks eligibility when the recent failure streak reaches three', () => {
    const milestone = buildWelfareFeedbackMilestone({
      coreCaptureSuccessCount: 5,
      exportOrCopySuccessCount: 5,
      syncSuccessCount: 0,
      highValueClickCount: 5,
      failureStreak: 3,
    });

    expect(milestone).toMatchObject({
      eligible: false,
      failureBlocked: true,
    });
  });
});
