import { beforeEach, describe, expect, it, vi } from 'vitest';

import { grantChannelSurveyReward } from '@/modules/benefits/service';

const mocks = vi.hoisted(() => ({
  inserts: [] as any[],
  updates: [] as any[],
  analyticsEvents: [] as any[],
  selectResults: [] as any[][],
}));

vi.mock('@/core/db', () => {
  function createSelectChain() {
    const chain: any = {
      from: () => chain,
      where: () => chain,
      orderBy: () => chain,
      limit: async () => mocks.selectResults.shift() || [],
      then: (resolve: (value: any[]) => void) =>
        resolve(mocks.selectResults.shift() || []),
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
                      rewardAction: 'extend_existing',
                    }
                  : values.expiresAt
                    ? {
                        ...values,
                        id: 'credential-paid-1',
                        code: 'ACT-PAID-0000',
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
    mocks.selectResults = [
      [
        {
          id: 'credential-paid-1',
          code: 'ACT-PAID-0000',
          ownerUserId: 'user-1',
          planCode: 'trial',
          sourceOrderNo: 'STARTER-ORDER-1',
          status: 'active',
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          notes: '',
        },
      ],
      [],
      [],
      [],
    ];
  });

  it('records benefit_reward_granted after a channel survey reward is granted', async () => {
    const result = await grantChannelSurveyReward({
      userId: 'user-1',
      surveySource: 'friend',
      surveyRole: 'operator',
      surveyUseCase: 'monitoring,analysis',
      surveyDetail: '{"team":"growth"}',
      rewardCredentialId: 'credential-paid-1',
      entryPoint: 'starter_claim',
      browserInstallId: 'browser-install-1',
      urlSource: 'extension',
      feature: 'keyword_opportunity',
      intent: 'trial',
      reason: 'quota_required',
      installId: 'install-1',
    });

    expect(result.rewardCredentialExpiresAt).toEqual(expect.any(Date));
    expect(mocks.analyticsEvents).toHaveLength(1);
    expect(mocks.analyticsEvents[0]).toMatchObject({
      eventName: 'benefit_reward_granted',
      source: 'server',
      userId: 'user-1',
      credentialCode: 'ACT-PAID-0000',
      properties: {
        rewardLedgerId: 'reward-ledger-1',
        taskType: 'channel_survey',
        rewardType: 'paid_extension',
        rewardAction: 'extend_existing',
        rewardCredentialCode: 'ACT-PAID-0000',
        surveySource: 'friend',
        surveyRole: 'operator',
        surveyUseCase: 'monitoring,analysis',
        entryPoint: 'starter_claim',
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
    expect(
      mocks.inserts.some((values) => Number(values.totalCredits || 0) > 0)
    ).toBe(false);
    expect(mocks.inserts).toContainEqual(
      expect.objectContaining({
        taskType: 'channel_survey_trial:starter:credential-paid-1',
      })
    );
  });

  it('does not let an unrelated legacy survey hide the paid starter survey', async () => {
    mocks.selectResults = [
      [
        {
          id: 'credential-paid-1',
          code: 'ACT-PAID-0000',
          ownerUserId: 'user-1',
          planCode: 'trial',
          sourceOrderNo: 'STARTER-ORDER-1',
          status: 'active',
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          notes: '',
        },
      ],
      [],
      [
        {
          id: 'legacy-survey',
          taskType: 'channel_survey_trial',
          status: 'completed',
          entryPoint: 'welfare',
          rewardCredentialId: 'legacy-free-trial',
        },
      ],
      [],
    ];

    const result = await grantChannelSurveyReward({
      userId: 'user-1',
      surveySource: 'friend',
      surveyRole: 'operator',
      surveyUseCase: 'monitoring',
      rewardCredentialId: 'credential-paid-1',
      entryPoint: 'starter_claim',
    });

    expect(result.alreadyCompleted).toBe(false);
    expect(mocks.inserts).toContainEqual(
      expect.objectContaining({
        taskType: 'channel_survey_trial:starter:credential-paid-1',
      })
    );
  });
});
