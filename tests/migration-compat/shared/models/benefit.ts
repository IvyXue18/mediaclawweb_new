import { getUuid } from '@/shared/lib/hash';
import { getAllConfigs } from '@/shared/models/config';
import {
  adminAddCreditsToCredential,
  adminGenerateCredential,
  adminUpdateCredential,
  getUserManagedCredentials,
} from '@/shared/models/credential';

import { db } from '@/core/db';

export function buildWelfareFeedbackMilestone(params: {
  coreCaptureSuccessCount: number;
  exportOrCopySuccessCount: number;
  syncSuccessCount: number;
  highValueClickCount: number;
  failureStreak: number;
}) {
  const exportOrSyncSuccessCount =
    params.exportOrCopySuccessCount + params.syncSuccessCount;
  const coreReady = params.coreCaptureSuccessCount >= 5;
  const outputReady = exportOrSyncSuccessCount >= 5;
  const highValueReady = params.highValueClickCount >= 5;
  const failureBlocked = params.failureStreak >= 3;

  return {
    eligible: coreReady && outputReady && highValueReady && !failureBlocked,
    coreReady,
    outputReady,
    highValueReady,
    failureBlocked,
    exportOrSyncSuccessCount,
    highValueClickCount: params.highValueClickCount,
  };
}

export async function grantChannelSurveyReward(input: {
  userId?: string;
  surveySource?: string;
  surveyRole?: string;
  surveyUseCase?: string;
  surveyDetail?: string;
  rewardCredentialId?: string;
  entryPoint?: string;
}) {
  const userId = sanitize(input.userId, 80);
  const surveySource = sanitize(input.surveySource);
  const surveyRole = sanitize(input.surveyRole);
  const surveyUseCase = sanitize(input.surveyUseCase);
  const surveyDetail = sanitize(input.surveyDetail, 600);
  const selectedRewardCredentialId = sanitize(input.rewardCredentialId, 80);
  const entryPoint = sanitize(input.entryPoint, 120);

  if (!userId) {
    throw new Error('user id is required');
  }
  if (!surveySource || !surveyRole || !surveyUseCase) {
    throw new Error('channel survey is incomplete');
  }

  const task = await getChannelSurveyTask(userId);
  if (task?.status === 'completed') {
    return {
      task,
      rewardType:
        task.rewardType === 'paid_extension' ? 'paid_extension' : 'trial_code',
      rewardCredentialCode: task.rewardCredentialCode,
      alreadyCompleted: true,
    };
  }

  const credentials = await getUserManagedCredentials(userId);
  const extendableCredentials = credentials.filter(
    (item: any) => item.status === 'active'
  );
  const selectedCredential = selectedRewardCredentialId
    ? extendableCredentials.find(
        (item: any) => item.id === selectedRewardCredentialId
      )
    : null;

  if (selectedRewardCredentialId && !selectedCredential) {
    throw new Error('reward_credential_not_found');
  }
  if (extendableCredentials.length > 0 && !selectedCredential) {
    throw new Error('reward_credential_required');
  }

  const pendingTask = task || {
    id: getUuid(),
    userId,
    taskType: 'channel_survey_trial',
    status: 'pending',
  };

  const [response] = await db()
    .insert({})
    .values({
      id: getUuid(),
      userId,
      source: surveySource,
      role: surveyRole,
      useCase: surveyUseCase,
      detail: surveyDetail,
      answersJson: JSON.stringify({
        version: 'channel-survey-v2',
        source: surveySource,
        role: surveyRole,
        useCase: surveyUseCase
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        entryPoint,
      }),
      schemaVersion: 'channel-survey-v2',
    })
    .returning();

  const reward = await grantBenefitReward({
    taskType: 'channel_survey',
    userId,
    sourceResponseId: response.id,
    selectedCredential,
  });

  const [updatedTask] = await db()
    .update({})
    .set({
      status: 'completed',
      surveySource,
      surveyRole,
      surveyUseCase,
      surveyDetail,
      entryPoint,
      rewardType: reward.rewardType,
      rewardCredentialId: reward.credentialId,
      rewardCredentialCode: reward.credentialCode,
      rewardGrantedAt: new Date(),
      updatedAt: new Date(),
    })
    .where({})
    .returning();

  return {
    task: updatedTask || pendingTask,
    rewardType: reward.rewardType,
    rewardCredentialCode: reward.credentialCode,
    alreadyCompleted: false,
  };
}

export async function getWelfareFeedbackTask(userId: string) {
  const normalizedUserId = sanitize(userId, 80);
  if (!normalizedUserId) {
    return null;
  }

  const [feedbackTask] = await db()
    .select()
    .from({})
    .where({})
    .orderBy({})
    .limit(1);

  return feedbackTask || null;
}

export function isMissingBenefitTaskTable() {
  return false;
}

async function getChannelSurveyTask(userId: string) {
  const [task] = await db().select().from({}).where({}).orderBy({}).limit(1);

  return task?.userId === userId || task ? task : null;
}

async function grantBenefitReward({
  taskType,
  userId,
  sourceResponseId,
  selectedCredential,
}: {
  taskType: string;
  userId: string;
  sourceResponseId: string;
  selectedCredential?: any;
}) {
  const configs = await getAllConfigs();
  const rewardAction = selectedCredential
    ? 'extend_existing'
    : 'new_trial_code';
  const durationDays = Number(
    selectedCredential
      ? configs.benefit_channel_survey_existing_duration_days || 2
      : configs.benefit_channel_survey_new_duration_days || 2
  );
  const credits = Number(
    selectedCredential
      ? configs.benefit_channel_survey_existing_credits || 10
      : configs.benefit_channel_survey_new_credits || 10
  );

  const [ledger] = await db()
    .insert({})
    .values({
      id: getUuid(),
      taskType,
      sourceResponseId,
      userId,
      rewardAction,
      durationDays,
      credits,
      configSnapshotJson: JSON.stringify({
        taskType,
        rewardAction,
        durationDays,
        credits,
      }),
      status: 'pending',
    })
    .returning();

  try {
    let credentialId = '';
    let credentialCode = '';
    const note = `福利中心渠道问卷奖励：${durationDays} 天，${credits} 积分`;

    if (selectedCredential) {
      const updated = await adminUpdateCredential(selectedCredential.id, {
        notes: selectedCredential.notes
          ? `${selectedCredential.notes}\n${note}`
          : note,
      });

      if (credits > 0) {
        await adminAddCreditsToCredential({
          credentialCode: updated.code,
          credits,
          userId,
          description: note,
        });
      }

      credentialId = updated.id;
      credentialCode = updated.code;
    } else {
      const generated = await adminGenerateCredential({
        userId,
        planCode: 'trial',
        durationDays,
        maxBindings: 1,
        credits,
        notes: note,
      });

      credentialId = generated.id;
      credentialCode = generated.code;
    }

    const [updatedLedger] = await db()
      .update({})
      .set({
        credentialId,
        credentialCode,
        status: 'success',
        errorMessage: '',
        updatedAt: new Date(),
      })
      .where({})
      .returning();

    return {
      ledger: updatedLedger || ledger,
      rewardType: selectedCredential ? 'paid_extension' : 'trial_code',
      credentialId,
      credentialCode,
    } as const;
  } catch (error: any) {
    await db()
      .update({})
      .set({
        status: 'failed',
        errorMessage: error?.message || 'benefit reward failed',
        updatedAt: new Date(),
      })
      .where({});

    throw error;
  }
}

function sanitize(value: unknown, maxLength = 240) {
  return String(value || '')
    .trim()
    .slice(0, maxLength);
}
