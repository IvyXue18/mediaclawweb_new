import { grantChannelSurveyReward } from '@/shared/models/benefit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  task: null as any,
  dbInserts: [] as any[],
  dbUpdates: [] as any[],
  getUserManagedCredentials: vi.fn(),
  adminGenerateCredential: vi.fn(),
  adminAddCreditsToCredential: vi.fn(),
  adminUpdateCredential: vi.fn(),
  getAllConfigs: vi.fn(),
}));

vi.mock('@/core/db', () => {
  function createSelectChain() {
    const chain: any = {
      from: () => chain,
      where: () => chain,
      orderBy: () => chain,
      limit: async () => (mocks.task ? [mocks.task] : []),
    };
    return chain;
  }

  return {
    db: () => ({
      select: () => createSelectChain(),
      insert: () => ({
        values: (values: any) => {
          mocks.dbInserts.push(values);
          return {
            returning: async () => [values],
          };
        },
      }),
      update: () => ({
        set: (values: any) => {
          mocks.dbUpdates.push(values);
          return {
            where: () => ({
              returning: async () => [values],
            }),
          };
        },
      }),
    }),
  };
});

vi.mock('@/shared/models/credential', () => ({
  getUserManagedCredentials: (...args: any[]) =>
    mocks.getUserManagedCredentials(...args),
  adminAddCreditsToCredential: (...args: any[]) =>
    mocks.adminAddCreditsToCredential(...args),
  adminGenerateCredential: (...args: any[]) =>
    mocks.adminGenerateCredential(...args),
  adminUpdateCredential: (...args: any[]) =>
    mocks.adminUpdateCredential(...args),
}));

vi.mock('@/shared/models/config', () => ({
  getAllConfigs: () => mocks.getAllConfigs(),
}));

const validSurveyInput = {
  userId: 'user-1',
  surveySource: 'friend',
  surveyRole: 'operator',
  surveyUseCase: 'monitoring,analysis',
  surveyDetail: '{"team":"growth"}',
  entryPoint: 'welfare-page',
};

describe('benefit reward claiming rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.task = null;
    mocks.dbInserts = [];
    mocks.dbUpdates = [];
    mocks.getUserManagedCredentials.mockResolvedValue([]);
    mocks.adminGenerateCredential.mockResolvedValue({
      id: 'generated-credential-1',
      code: 'ACT-TRIAL-0000',
    });
    mocks.adminAddCreditsToCredential.mockResolvedValue(undefined);
    mocks.adminUpdateCredential.mockResolvedValue({
      id: 'credential-1',
      code: 'ACT-PAID-0000',
      notes: '',
    });
    mocks.getAllConfigs.mockResolvedValue({
      benefit_channel_survey_enabled: 'true',
      benefit_channel_survey_new_duration_days: '2',
      benefit_channel_survey_new_credits: '10',
      benefit_channel_survey_existing_duration_days: '2',
      benefit_channel_survey_existing_credits: '10',
    });
  });

  it('returns a completed channel survey task without granting another reward', async () => {
    mocks.task = {
      id: 'task-1',
      userId: 'user-1',
      taskType: 'channel_survey_trial',
      status: 'completed',
      rewardType: 'trial_code',
      rewardCredentialCode: 'ACT-DONE-0000',
    };

    const result = await grantChannelSurveyReward(validSurveyInput);

    expect(result).toMatchObject({
      alreadyCompleted: true,
      rewardType: 'trial_code',
      rewardCredentialCode: 'ACT-DONE-0000',
    });
    expect(mocks.getUserManagedCredentials).not.toHaveBeenCalled();
    expect(mocks.dbInserts).toHaveLength(0);
  });

  it('requires choosing an existing credential when the user has active credentials', async () => {
    mocks.getUserManagedCredentials.mockResolvedValue([
      {
        id: 'credential-1',
        code: 'ACT-PAID-0000',
        status: 'active',
      },
    ]);

    await expect(grantChannelSurveyReward(validSurveyInput)).rejects.toThrow(
      'reward_credential_required'
    );
    expect(mocks.dbInserts).toHaveLength(0);
  });

  it('marks the benefit ledger failed when reward credential generation fails', async () => {
    mocks.adminGenerateCredential.mockRejectedValue(
      new Error('credential backend unavailable')
    );

    await expect(grantChannelSurveyReward(validSurveyInput)).rejects.toThrow(
      'credential backend unavailable'
    );

    expect(mocks.dbInserts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          taskType: 'channel_survey',
          rewardAction: 'new_trial_code',
          status: 'pending',
        }),
      ])
    );
    expect(mocks.dbUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'failed',
          errorMessage: 'credential backend unavailable',
        }),
      ])
    );
  });
});
