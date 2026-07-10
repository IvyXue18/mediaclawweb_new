import { createHash } from 'node:crypto';
import { and, count, desc, eq, like, or, type SQL } from 'drizzle-orm';

import { db } from '@/core/db';
import {
  benefitRewardLedger,
  benefitTask,
  channelSurveyResponse,
  credential,
  credentialCredit,
  experienceFeedbackResponse,
  user,
  welfareFeedbackTask,
  welfareUsageSummary,
} from '@/config/db/schema';
import { getAllConfigs, type ConfigMap } from '@/modules/config/service';
import { generateActivationCode } from '@/modules/credentials/service';
import { getUuid } from '@/lib/hash';
import { recordServerAnalyticsEvent } from '@/lib/server-analytics';

export const CHANNEL_SURVEY_TASK_TYPE = 'channel_survey_trial';
export const CHANNEL_SURVEY_REWARD_TASK_TYPE = 'channel_survey';
export const EXPERIENCE_FEEDBACK_REWARD_TASK_TYPE = 'experience_feedback';
export const WELFARE_FEEDBACK_TASK_TYPE = 'usage_feedback';

const DEFAULT_TRIAL_MAX_BINDINGS = 1;

type BenefitRewardTaskType =
  | typeof CHANNEL_SURVEY_REWARD_TASK_TYPE
  | typeof EXPERIENCE_FEEDBACK_REWARD_TASK_TYPE;

type BenefitRewardRule = {
  durationDays: number;
  credits: number;
};

type BenefitRewardTaskConfig = {
  enabled: boolean;
  newCredential: BenefitRewardRule;
  existingCredential: BenefitRewardRule;
};

type BenefitRewardConfig = Record<
  BenefitRewardTaskType,
  BenefitRewardTaskConfig
>;

const DEFAULT_BENEFIT_REWARD_CONFIG: BenefitRewardConfig = {
  [CHANNEL_SURVEY_REWARD_TASK_TYPE]: {
    enabled: true,
    newCredential: { durationDays: 2, credits: 10 },
    existingCredential: { durationDays: 2, credits: 10 },
  },
  [EXPERIENCE_FEEDBACK_REWARD_TASK_TYPE]: {
    enabled: true,
    newCredential: { durationDays: 5, credits: 0 },
    existingCredential: { durationDays: 5, credits: 0 },
  },
};

export function isMissingBenefitTaskTable(error: unknown) {
  const pending = [error];
  const visited = new Set<unknown>();

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    if (typeof current === 'object') {
      const candidate = current as {
        cause?: unknown;
        code?: unknown;
        message?: unknown;
      };
      const code =
        typeof candidate.code === 'string' ? candidate.code : undefined;
      const message =
        typeof candidate.message === 'string' ? candidate.message : '';

      if (
        code === '42P01' ||
        code === 'SQLITE_ERROR' ||
        ((message.includes('benefit_task') ||
          message.includes('channel_survey_response') ||
          message.includes('experience_feedback_response') ||
          message.includes('benefit_reward_ledger') ||
          message.includes('welfare_usage_summary') ||
          message.includes('welfare_feedback_task')) &&
          (message.includes('does not exist') ||
            message.includes('no such table') ||
            message.includes('undefined table')))
      ) {
        return true;
      }

      if ('cause' in candidate) pending.push(candidate.cause);
    }
  }

  return false;
}

export function isBrowserTrialAlreadyClaimedError(error: unknown) {
  const pending = [error];
  const visited = new Set<unknown>();

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    if (typeof current === 'object') {
      const candidate = current as {
        cause?: unknown;
        code?: unknown;
        constraint_name?: unknown;
        constraint?: unknown;
        message?: unknown;
      };
      const code =
        typeof candidate.code === 'string' ? candidate.code : undefined;
      const constraintName =
        typeof candidate.constraint_name === 'string'
          ? candidate.constraint_name
          : typeof candidate.constraint === 'string'
            ? candidate.constraint
            : '';
      const message =
        typeof candidate.message === 'string' ? candidate.message : '';

      if (
        message === 'browser_trial_already_claimed' ||
        (['23505', 'SQLITE_CONSTRAINT_UNIQUE'].includes(code || '') &&
          (constraintName === 'uq_benefit_task_browser_trial' ||
            message.includes('uq_benefit_task_browser_trial')))
      ) {
        return true;
      }

      if ('cause' in candidate) pending.push(candidate.cause);
    }
  }

  return false;
}

function sanitizeSurveyValue(value: string | null | undefined, max = 120) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, max);
}

function hashBrowserInstallId(value: string | null | undefined) {
  const normalized = sanitizeSurveyValue(value, 256);
  if (!normalized) return '';

  return createHash('sha256')
    .update(`mediaclaw:welfare:v1:${normalized}`)
    .digest('hex');
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
}

function parseJson(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function readBooleanConfig(
  configs: ConfigMap,
  key: string,
  defaultValue: boolean
) {
  const value = configs[key];
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
}

function readNumberConfig(
  configs: ConfigMap,
  key: string,
  defaultValue: number
) {
  const value = Number(configs[key]);
  if (!Number.isFinite(value) || value < 0) return defaultValue;
  return Math.floor(value);
}

function getBenefitRewardConfigFromConfigs(
  configs: ConfigMap
): BenefitRewardConfig {
  return {
    [CHANNEL_SURVEY_REWARD_TASK_TYPE]: {
      enabled: readBooleanConfig(
        configs,
        'benefit_channel_survey_enabled',
        DEFAULT_BENEFIT_REWARD_CONFIG.channel_survey.enabled
      ),
      newCredential: {
        durationDays: readNumberConfig(
          configs,
          'benefit_channel_survey_new_duration_days',
          DEFAULT_BENEFIT_REWARD_CONFIG.channel_survey.newCredential
            .durationDays
        ),
        credits: readNumberConfig(
          configs,
          'benefit_channel_survey_new_credits',
          DEFAULT_BENEFIT_REWARD_CONFIG.channel_survey.newCredential.credits
        ),
      },
      existingCredential: {
        durationDays: readNumberConfig(
          configs,
          'benefit_channel_survey_existing_duration_days',
          DEFAULT_BENEFIT_REWARD_CONFIG.channel_survey.existingCredential
            .durationDays
        ),
        credits: readNumberConfig(
          configs,
          'benefit_channel_survey_existing_credits',
          DEFAULT_BENEFIT_REWARD_CONFIG.channel_survey.existingCredential
            .credits
        ),
      },
    },
    [EXPERIENCE_FEEDBACK_REWARD_TASK_TYPE]: {
      enabled: readBooleanConfig(
        configs,
        'benefit_experience_feedback_enabled',
        DEFAULT_BENEFIT_REWARD_CONFIG.experience_feedback.enabled
      ),
      newCredential: {
        durationDays: readNumberConfig(
          configs,
          'benefit_experience_feedback_new_duration_days',
          DEFAULT_BENEFIT_REWARD_CONFIG.experience_feedback.newCredential
            .durationDays
        ),
        credits: readNumberConfig(
          configs,
          'benefit_experience_feedback_new_credits',
          DEFAULT_BENEFIT_REWARD_CONFIG.experience_feedback.newCredential
            .credits
        ),
      },
      existingCredential: {
        durationDays: readNumberConfig(
          configs,
          'benefit_experience_feedback_existing_duration_days',
          DEFAULT_BENEFIT_REWARD_CONFIG.experience_feedback.existingCredential
            .durationDays
        ),
        credits: readNumberConfig(
          configs,
          'benefit_experience_feedback_existing_credits',
          DEFAULT_BENEFIT_REWARD_CONFIG.experience_feedback.existingCredential
            .credits
        ),
      },
    },
  };
}

export async function getBenefitRewardConfig() {
  return getBenefitRewardConfigFromConfigs(await getAllConfigs());
}

function getBenefitRewardLabel(taskType: BenefitRewardTaskType) {
  return taskType === CHANNEL_SURVEY_REWARD_TASK_TYPE
    ? '渠道调研'
    : '使用体验反馈';
}

async function getBenefitTaskByType(userId: string, taskType: string) {
  const [row] = await db()
    .select()
    .from(benefitTask)
    .where(
      and(eq(benefitTask.userId, userId), eq(benefitTask.taskType, taskType))
    )
    .orderBy(desc(benefitTask.createdAt))
    .limit(1);

  return row || null;
}

export async function getChannelSurveyTask(userId: string) {
  return getBenefitTaskByType(userId, CHANNEL_SURVEY_TASK_TYPE);
}

export async function getExperienceFeedbackTask(userId: string) {
  return getBenefitTaskByType(userId, EXPERIENCE_FEEDBACK_REWARD_TASK_TYPE);
}

export async function getWelfareFeedbackTask(userId: string) {
  const normalizedUserId = sanitizeSurveyValue(userId, 80);
  if (!normalizedUserId) return null;

  const [feedbackTask] = await db()
    .select()
    .from(welfareFeedbackTask)
    .where(
      and(
        eq(welfareFeedbackTask.userId, normalizedUserId),
        eq(welfareFeedbackTask.taskType, WELFARE_FEEDBACK_TASK_TYPE)
      )
    )
    .orderBy(desc(welfareFeedbackTask.createdAt))
    .limit(1);

  return feedbackTask || null;
}

export async function getWelfareFeedbackStatus(userId: string) {
  const normalizedUserId = sanitizeSurveyValue(userId, 80);
  if (!normalizedUserId) {
    return { usage: null, feedbackTask: null };
  }

  const [usage] = await db()
    .select()
    .from(welfareUsageSummary)
    .where(eq(welfareUsageSummary.userId, normalizedUserId))
    .orderBy(desc(welfareUsageSummary.updatedAt))
    .limit(1);

  return {
    usage: usage || null,
    feedbackTask: await getWelfareFeedbackTask(normalizedUserId),
  };
}

async function createPendingBenefitTask({
  userId,
  taskType,
  browserInstallHash = '',
}: {
  userId: string;
  taskType: string;
  browserInstallHash?: string;
}) {
  const existing = await getBenefitTaskByType(userId, taskType);
  if (existing) return existing;

  try {
    const [created] = await db()
      .insert(benefitTask)
      .values({
        id: getUuid(),
        userId,
        taskType,
        status: 'pending',
        browserInstallHash,
      })
      .returning();

    return created;
  } catch (error) {
    const duplicated = await getBenefitTaskByType(userId, taskType);
    if (duplicated) return duplicated;
    throw error;
  }
}

async function getChannelSurveyTrialTaskByBrowserInstallHash(
  browserInstallHash: string
) {
  if (!browserInstallHash) return null;

  const [row] = await db()
    .select()
    .from(benefitTask)
    .where(
      and(
        eq(benefitTask.browserInstallHash, browserInstallHash),
        eq(benefitTask.taskType, CHANNEL_SURVEY_TASK_TYPE),
        eq(benefitTask.rewardType, 'trial_code')
      )
    )
    .orderBy(desc(benefitTask.createdAt))
    .limit(1);

  return row || null;
}

async function getUserManagedCredentials(userId: string) {
  return db()
    .select()
    .from(credential)
    .where(
      and(
        eq(credential.ownerUserId, userId),
        or(eq(credential.status, 'active'), eq(credential.status, 'trial'))!
      )
    )
    .orderBy(desc(credential.createdAt));
}

function appendRewardNote(existingNotes: string | null, note: string) {
  const normalized = String(existingNotes || '').trim();
  return normalized ? `${normalized}\n${note}` : note;
}

function extendExpiration(expiresAt: Date | null, durationDays: number) {
  if (durationDays <= 0) return expiresAt;
  const base =
    expiresAt && expiresAt.getTime() > Date.now()
      ? new Date(expiresAt)
      : new Date();
  return new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);
}

async function addCredentialCredits({
  credentialId,
  credentialCode,
  userId,
  credits,
  expiresAt,
  description,
}: {
  credentialId: string;
  credentialCode: string;
  userId: string;
  credits: number;
  expiresAt?: Date | null;
  description: string;
}) {
  if (credits <= 0) return;

  await db()
    .insert(credentialCredit)
    .values({
      id: getUuid(),
      credentialId,
      credentialCode,
      userId,
      orderNo: null,
      totalCredits: credits,
      usedCredits: 0,
      expiresAt: expiresAt || null,
      status: 'active',
      activatedAt: new Date(),
      metadata: safeStringify({ description, source: 'benefit_reward' }),
    });
}

async function grantBenefitReward({
  taskType,
  userId,
  sourceResponseId,
  selectedCredential,
}: {
  taskType: BenefitRewardTaskType;
  userId: string;
  sourceResponseId: string;
  selectedCredential?:
    | Awaited<ReturnType<typeof getUserManagedCredentials>>[number]
    | null;
}) {
  const rewardConfigs = await getBenefitRewardConfig();
  const taskConfig = rewardConfigs[taskType];
  if (!taskConfig?.enabled) throw new Error('benefit_reward_disabled');

  const rewardAction = selectedCredential
    ? 'extend_existing'
    : 'new_trial_code';
  const rule = selectedCredential
    ? taskConfig.existingCredential
    : taskConfig.newCredential;
  const label = getBenefitRewardLabel(taskType);
  const note = `福利中心${label}奖励：${rule.durationDays} 天，${rule.credits} 积分`;

  const [ledger] = await db()
    .insert(benefitRewardLedger)
    .values({
      id: getUuid(),
      taskType,
      sourceResponseId,
      userId,
      rewardAction,
      durationDays: rule.durationDays,
      credits: rule.credits,
      configSnapshotJson: safeStringify({
        taskType,
        rewardAction,
        rule,
        taskConfig,
      }),
      status: 'pending',
    })
    .returning();

  try {
    let credentialId = '';
    let credentialCode = '';

    if (selectedCredential) {
      const nextExpiresAt = extendExpiration(
        selectedCredential.expiresAt,
        rule.durationDays
      );
      const [updated] = await db()
        .update(credential)
        .set({
          expiresAt: nextExpiresAt,
          notes: appendRewardNote(selectedCredential.notes, note),
          updatedAt: new Date(),
        })
        .where(eq(credential.id, selectedCredential.id))
        .returning();

      credentialId = updated.id;
      credentialCode = updated.code;
      await addCredentialCredits({
        credentialId,
        credentialCode,
        userId,
        credits: rule.credits,
        expiresAt: nextExpiresAt,
        description: note,
      });
    } else {
      const [owner] = await db()
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);
      const expiresAt = extendExpiration(null, rule.durationDays);
      const [created] = await db()
        .insert(credential)
        .values({
          id: getUuid(),
          code: generateActivationCode('ACT'),
          ownerUserId: userId,
          sourceOrderNo: null,
          planCode: 'trial',
          durationPreset: 'trial',
          maxBindings: DEFAULT_TRIAL_MAX_BINDINGS,
          expiresAt,
          status: 'active',
          partnerId: null,
          variantId: null,
          notes: note,
        })
        .returning();

      credentialId = created.id;
      credentialCode = created.code;
      await addCredentialCredits({
        credentialId,
        credentialCode,
        userId,
        credits: rule.credits,
        expiresAt,
        description: note,
      });
      void owner;
    }

    const [updatedLedger] = await db()
      .update(benefitRewardLedger)
      .set({
        credentialId,
        credentialCode,
        status: 'success',
        errorMessage: '',
        updatedAt: new Date(),
      })
      .where(eq(benefitRewardLedger.id, ledger.id))
      .returning();

    return {
      ledger: updatedLedger,
      rewardType: selectedCredential ? 'paid_extension' : 'trial_code',
      credentialId,
      credentialCode,
    } as const;
  } catch (error: any) {
    await db()
      .update(benefitRewardLedger)
      .set({
        status: 'failed',
        errorMessage: error?.message || 'benefit reward failed',
        updatedAt: new Date(),
      })
      .where(eq(benefitRewardLedger.id, ledger.id));
    throw error;
  }
}

export async function grantChannelSurveyReward(input: {
  userId: string;
  surveySource: string;
  surveyRole: string;
  surveyUseCase: string;
  surveyDetail?: string;
  rewardCredentialId?: string;
  entryPoint?: string;
  browserInstallId?: string;
  urlSource?: string;
  feature?: string;
  intent?: string;
  reason?: string;
  installId?: string;
}) {
  const userId = sanitizeSurveyValue(input.userId, 80);
  const surveySource = sanitizeSurveyValue(input.surveySource);
  const surveyRole = sanitizeSurveyValue(input.surveyRole);
  const surveyUseCase = sanitizeSurveyValue(input.surveyUseCase);
  const surveyDetail = sanitizeSurveyValue(input.surveyDetail, 600);
  const selectedRewardCredentialId = sanitizeSurveyValue(
    input.rewardCredentialId,
    80
  );
  const entryPoint = sanitizeSurveyValue(input.entryPoint, 120);
  const browserInstallHash = hashBrowserInstallId(input.browserInstallId);
  const urlSource = sanitizeSurveyValue(input.urlSource, 120);
  const feature = sanitizeSurveyValue(input.feature, 120);
  const intent = sanitizeSurveyValue(input.intent, 120);
  const reason = sanitizeSurveyValue(input.reason, 120);
  const installId = sanitizeSurveyValue(input.installId, 191);

  if (!userId) throw new Error('user id is required');
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
  const selectedCredential = selectedRewardCredentialId
    ? credentials.find((item) => item.id === selectedRewardCredentialId)
    : null;

  if (credentials.length > 0 && !selectedRewardCredentialId) {
    throw new Error('reward_credential_required');
  }
  if (selectedRewardCredentialId && !selectedCredential) {
    throw new Error('reward_credential_not_found');
  }
  if (!selectedCredential && browserInstallHash) {
    const existingTrialTask =
      await getChannelSurveyTrialTaskByBrowserInstallHash(browserInstallHash);
    if (existingTrialTask && existingTrialTask.userId !== userId) {
      throw new Error('browser_trial_already_claimed');
    }
  }

  const pendingTask =
    task ||
    (await createPendingBenefitTask({
      userId,
      taskType: CHANNEL_SURVEY_TASK_TYPE,
      browserInstallHash,
    }));

  const [response] = await db()
    .insert(channelSurveyResponse)
    .values({
      id: getUuid(),
      userId,
      source: surveySource,
      role: surveyRole,
      useCase: surveyUseCase,
      detail: surveyDetail,
      answersJson: safeStringify({
        version: 'channel-survey-v2',
        source: surveySource,
        role: surveyRole,
        useCase: surveyUseCase
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        detail: parseJson(surveyDetail),
        entryPoint,
      }),
      schemaVersion: 'channel-survey-v2',
    })
    .returning();

  const reward = await grantBenefitReward({
    taskType: CHANNEL_SURVEY_REWARD_TASK_TYPE,
    userId,
    sourceResponseId: response.id,
    selectedCredential,
  });

  await db()
    .update(channelSurveyResponse)
    .set({ rewardLedgerId: reward.ledger.id, updatedAt: new Date() })
    .where(eq(channelSurveyResponse.id, response.id));

  const [updatedTask] = await db()
    .update(benefitTask)
    .set({
      status: 'completed',
      surveySource,
      surveyRole,
      surveyUseCase,
      surveyDetail,
      entryPoint,
      browserInstallHash: pendingTask.browserInstallHash || browserInstallHash,
      rewardType: reward.rewardType,
      rewardCredentialId: reward.credentialId,
      rewardCredentialCode: reward.credentialCode,
      rewardGrantedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(benefitTask.id, pendingTask.id))
    .returning();

  await recordServerAnalyticsEvent({
    eventName: 'benefit_reward_granted',
    source: 'server',
    userId,
    credentialId: reward.credentialId,
    credentialCode: reward.credentialCode,
    properties: {
      rewardLedgerId: reward.ledger.id,
      taskType: CHANNEL_SURVEY_REWARD_TASK_TYPE,
      rewardType: reward.rewardType,
      rewardAction: reward.ledger.rewardAction,
      rewardCredentialId: reward.credentialId,
      rewardCredentialCode: reward.credentialCode,
      surveySource,
      surveyRole,
      surveyUseCase,
      entryPoint,
      urlSource: urlSource || undefined,
      feature: feature || undefined,
      intent: intent || undefined,
      reason: reason || undefined,
      installId: installId || undefined,
      browserInstallHash: updatedTask.browserInstallHash || browserInstallHash,
      sourceResponseId: response.id,
    },
  });

  return {
    task: updatedTask,
    rewardLedgerId: reward.ledger.id,
    rewardType: reward.rewardType,
    rewardCredentialCode: reward.credentialCode,
    alreadyCompleted: false,
  };
}

export async function grantExperienceFeedbackReward(input: {
  userId: string;
  rating: number;
  comment: string;
  expectedFeature: string;
  rewardCredentialId?: string;
  entryPoint?: string;
}) {
  const userId = sanitizeSurveyValue(input.userId, 80);
  const rating = Number(input.rating);
  const comment = sanitizeSurveyValue(input.comment, 1200);
  const expectedFeature = sanitizeSurveyValue(input.expectedFeature, 800);
  const selectedRewardCredentialId = sanitizeSurveyValue(
    input.rewardCredentialId,
    80
  );
  const entryPoint = sanitizeSurveyValue(input.entryPoint, 120);

  if (!userId) throw new Error('user id is required');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('experience feedback rating is invalid');
  }
  if (!comment || !expectedFeature) {
    throw new Error('experience feedback is incomplete');
  }

  const task = await getExperienceFeedbackTask(userId);
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
  const selectedCredential = selectedRewardCredentialId
    ? credentials.find((item) => item.id === selectedRewardCredentialId)
    : credentials[0] || null;

  if (selectedRewardCredentialId && !selectedCredential) {
    throw new Error('reward_credential_not_found');
  }

  const pendingTask =
    task ||
    (await createPendingBenefitTask({
      userId,
      taskType: EXPERIENCE_FEEDBACK_REWARD_TASK_TYPE,
    }));

  const [response] = await db()
    .insert(experienceFeedbackResponse)
    .values({
      id: getUuid(),
      userId,
      rating,
      comment,
      expectedFeature,
      answersJson: safeStringify({
        version: 'experience-feedback-v1',
        rating,
        comment,
        expectedFeature,
        entryPoint,
      }),
      schemaVersion: 'experience-feedback-v1',
    })
    .returning();

  const reward = await grantBenefitReward({
    taskType: EXPERIENCE_FEEDBACK_REWARD_TASK_TYPE,
    userId,
    sourceResponseId: response.id,
    selectedCredential,
  });

  await db()
    .update(experienceFeedbackResponse)
    .set({ rewardLedgerId: reward.ledger.id, updatedAt: new Date() })
    .where(eq(experienceFeedbackResponse.id, response.id));

  const [updatedTask] = await db()
    .update(benefitTask)
    .set({
      status: 'completed',
      surveySource: EXPERIENCE_FEEDBACK_REWARD_TASK_TYPE,
      surveyRole: `rating:${rating}`,
      surveyUseCase: 'feedback',
      surveyDetail: response.answersJson,
      entryPoint,
      rewardType: reward.rewardType,
      rewardCredentialId: reward.credentialId,
      rewardCredentialCode: reward.credentialCode,
      rewardGrantedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(benefitTask.id, pendingTask.id))
    .returning();

  return {
    task: updatedTask,
    rewardType: reward.rewardType,
    rewardCredentialCode: reward.credentialCode,
    alreadyCompleted: false,
  };
}

export async function listChannelSurveyResponses(params: {
  page: number;
  pageSize: number;
  source?: string | null;
  credentialCode?: string | null;
  search?: string | null;
}) {
  const conditions: SQL[] = [];
  if (params.source && params.source !== 'all') {
    conditions.push(eq(channelSurveyResponse.source, params.source));
  }
  if (params.credentialCode) {
    conditions.push(
      like(benefitRewardLedger.credentialCode, `%${params.credentialCode}%`)
    );
  }
  if (params.search) {
    const term = `%${params.search.trim()}%`;
    conditions.push(
      or(
        like(channelSurveyResponse.userId, term),
        like(channelSurveyResponse.source, term),
        like(channelSurveyResponse.role, term),
        like(channelSurveyResponse.useCase, term),
        like(channelSurveyResponse.detail, term),
        like(benefitRewardLedger.credentialCode, term),
        like(user.email, term)
      ) as SQL
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.pageSize;

  const [totalResult] = await db()
    .select({ count: count() })
    .from(channelSurveyResponse)
    .leftJoin(
      benefitRewardLedger,
      eq(channelSurveyResponse.rewardLedgerId, benefitRewardLedger.id)
    )
    .leftJoin(user, eq(channelSurveyResponse.userId, user.id))
    .where(where);

  const rows = await db()
    .select({
      id: channelSurveyResponse.id,
      userId: channelSurveyResponse.userId,
      userEmail: user.email,
      userName: user.name,
      source: channelSurveyResponse.source,
      role: channelSurveyResponse.role,
      useCase: channelSurveyResponse.useCase,
      detail: channelSurveyResponse.detail,
      answersJson: channelSurveyResponse.answersJson,
      rewardCredentialCode: benefitRewardLedger.credentialCode,
      rewardDurationDays: benefitRewardLedger.durationDays,
      rewardCredits: benefitRewardLedger.credits,
      rewardStatus: benefitRewardLedger.status,
      createdAt: channelSurveyResponse.createdAt,
      updatedAt: channelSurveyResponse.updatedAt,
    })
    .from(channelSurveyResponse)
    .leftJoin(
      benefitRewardLedger,
      eq(channelSurveyResponse.rewardLedgerId, benefitRewardLedger.id)
    )
    .leftJoin(user, eq(channelSurveyResponse.userId, user.id))
    .where(where)
    .orderBy(desc(channelSurveyResponse.createdAt))
    .limit(params.pageSize)
    .offset(offset);

  return { items: rows, total: totalResult.count };
}

export async function listExperienceFeedbackResponses(params: {
  page: number;
  pageSize: number;
  rating?: number | null;
  credentialCode?: string | null;
  search?: string | null;
}) {
  const conditions: SQL[] = [];
  if (params.rating && params.rating > 0) {
    conditions.push(eq(experienceFeedbackResponse.rating, params.rating));
  }
  if (params.credentialCode) {
    conditions.push(
      like(benefitRewardLedger.credentialCode, `%${params.credentialCode}%`)
    );
  }
  if (params.search) {
    const term = `%${params.search.trim()}%`;
    conditions.push(
      or(
        like(experienceFeedbackResponse.userId, term),
        like(experienceFeedbackResponse.comment, term),
        like(experienceFeedbackResponse.expectedFeature, term),
        like(benefitRewardLedger.credentialCode, term),
        like(user.email, term)
      ) as SQL
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.pageSize;

  const [totalResult] = await db()
    .select({ count: count() })
    .from(experienceFeedbackResponse)
    .leftJoin(
      benefitRewardLedger,
      eq(experienceFeedbackResponse.rewardLedgerId, benefitRewardLedger.id)
    )
    .leftJoin(user, eq(experienceFeedbackResponse.userId, user.id))
    .where(where);

  const rows = await db()
    .select({
      id: experienceFeedbackResponse.id,
      userId: experienceFeedbackResponse.userId,
      userEmail: user.email,
      userName: user.name,
      rating: experienceFeedbackResponse.rating,
      comment: experienceFeedbackResponse.comment,
      expectedFeature: experienceFeedbackResponse.expectedFeature,
      answersJson: experienceFeedbackResponse.answersJson,
      rewardCredentialCode: benefitRewardLedger.credentialCode,
      rewardDurationDays: benefitRewardLedger.durationDays,
      rewardCredits: benefitRewardLedger.credits,
      rewardStatus: benefitRewardLedger.status,
      createdAt: experienceFeedbackResponse.createdAt,
      updatedAt: experienceFeedbackResponse.updatedAt,
    })
    .from(experienceFeedbackResponse)
    .leftJoin(
      benefitRewardLedger,
      eq(experienceFeedbackResponse.rewardLedgerId, benefitRewardLedger.id)
    )
    .leftJoin(user, eq(experienceFeedbackResponse.userId, user.id))
    .where(where)
    .orderBy(desc(experienceFeedbackResponse.createdAt))
    .limit(params.pageSize)
    .offset(offset);

  return { items: rows, total: totalResult.count };
}

export async function listBenefitRewardLedgers(params: {
  page: number;
  pageSize: number;
  taskType?: string | null;
  status?: string | null;
  credentialCode?: string | null;
  search?: string | null;
}) {
  const conditions: SQL[] = [];
  if (params.taskType && params.taskType !== 'all') {
    conditions.push(eq(benefitRewardLedger.taskType, params.taskType));
  }
  if (params.status && params.status !== 'all') {
    conditions.push(eq(benefitRewardLedger.status, params.status));
  }
  if (params.credentialCode) {
    conditions.push(
      like(benefitRewardLedger.credentialCode, `%${params.credentialCode}%`)
    );
  }
  if (params.search) {
    const term = `%${params.search.trim()}%`;
    conditions.push(
      or(
        like(benefitRewardLedger.userId, term),
        like(benefitRewardLedger.sourceResponseId, term),
        like(benefitRewardLedger.credentialCode, term),
        like(benefitRewardLedger.errorMessage, term),
        like(user.email, term)
      ) as SQL
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.pageSize;

  const [totalResult] = await db()
    .select({ count: count() })
    .from(benefitRewardLedger)
    .leftJoin(user, eq(benefitRewardLedger.userId, user.id))
    .where(where);

  const rows = await db()
    .select({
      id: benefitRewardLedger.id,
      taskType: benefitRewardLedger.taskType,
      sourceResponseId: benefitRewardLedger.sourceResponseId,
      userId: benefitRewardLedger.userId,
      userEmail: user.email,
      userName: user.name,
      rewardAction: benefitRewardLedger.rewardAction,
      credentialId: benefitRewardLedger.credentialId,
      credentialCode: benefitRewardLedger.credentialCode,
      durationDays: benefitRewardLedger.durationDays,
      credits: benefitRewardLedger.credits,
      status: benefitRewardLedger.status,
      errorMessage: benefitRewardLedger.errorMessage,
      createdAt: benefitRewardLedger.createdAt,
      updatedAt: benefitRewardLedger.updatedAt,
    })
    .from(benefitRewardLedger)
    .leftJoin(user, eq(benefitRewardLedger.userId, user.id))
    .where(where)
    .orderBy(desc(benefitRewardLedger.createdAt))
    .limit(params.pageSize)
    .offset(offset);

  return { items: rows, total: totalResult.count };
}
