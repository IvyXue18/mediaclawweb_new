import { beforeEach, describe, expect, it, vi } from 'vitest';

import { grantChannelSurveyReward } from '@/modules/benefits/service';

const mocks = vi.hoisted(() => ({
  inserts: [] as any[],
  updates: [] as any[],
  analyticsEvents: [] as any[],
}));

vi.mock('@/core/db', () => {
  function createSelectChain() {
    const chain: any = {
      from: () => chain,
      where: () => chain,
      orderBy: () => chain,
      limit: async () => [],
      then: (resolve: (value: any[]) => void) => resolve([]),
    };
    return chain;
  }

  return {
    db: () => ({
      select: () => createSelectChain(),
      insert: () => ({
        values: (values: any) => {
          mocks.inserts.push(values);
          return {
            returning: async () => [values],
          };
        },
      }),
      update: () => ({
        set: (values: any) => {
          mocks.updates.push(values);
          return {
            where: () => ({
              returning: async () => [
                values.status === 'success'
                  ? {
                      ...values,
                      id: 'reward-ledger-1',
                      rewardAction: 'new_trial_code',
                    }
                  : values,
              ],
            }),
          };
        },
      }),
    }),
  };
});

vi.mock('@/modules/config/service', () => ({
  getAllConfigs: async () => ({
    benefit_channel_survey_enabled: 'true',
    benefit_channel_survey_new_duration_days: '2',
    benefit_channel_survey_new_credits: '10',
    benefit_channel_survey_existing_duration_days: '2',
    benefit_channel_survey_existing_credits: '10',
  }),
}));

vi.mock('@/modules/credentials/service', () => ({
  generateActivationCode: () => 'ACT-TRIAL-0000',
}));

vi.mock('@/lib/server-analytics', () => ({
  recordServerAnalyticsEvent: async (event: any) => {
    mocks.analyticsEvents.push(event);
  },
}));

describe('benefit reward analytics events', () => {
  beforeEach(() => {
    mocks.inserts = [];
    mocks.updates = [];
    mocks.analyticsEvents = [];
  });

  it('records benefit_reward_granted after a channel survey reward is granted', async () => {
    await grantChannelSurveyReward({
      userId: 'user-1',
      surveySource: 'friend',
      surveyRole: 'operator',
      surveyUseCase: 'monitoring,analysis',
      surveyDetail: '{"team":"growth"}',
      entryPoint: 'feature_gate',
      browserInstallId: 'browser-install-1',
      urlSource: 'extension',
      feature: 'keyword_opportunity',
      intent: 'trial',
      reason: 'quota_required',
      installId: 'install-1',
    });

    expect(mocks.analyticsEvents).toHaveLength(1);
    expect(mocks.analyticsEvents[0]).toMatchObject({
      eventName: 'benefit_reward_granted',
      source: 'server',
      userId: 'user-1',
      credentialCode: 'ACT-TRIAL-0000',
      properties: {
        rewardLedgerId: 'reward-ledger-1',
        taskType: 'channel_survey',
        rewardType: 'trial_code',
        rewardAction: 'new_trial_code',
        rewardCredentialCode: 'ACT-TRIAL-0000',
        surveySource: 'friend',
        surveyRole: 'operator',
        surveyUseCase: 'monitoring,analysis',
        entryPoint: 'feature_gate',
        urlSource: 'extension',
        feature: 'keyword_opportunity',
        intent: 'trial',
        reason: 'quota_required',
        installId: 'install-1',
      },
    });
    expect(mocks.analyticsEvents[0].properties.browserInstallHash).toEqual(
      expect.any(String)
    );
  });
});
