/**
 * SQLite schema definitions.
 *
 * This is the SQLite dialect of the database schema.
 * To use: set DATABASE_PROVIDER=sqlite in .env.local
 */

import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const table = sqliteTable;

const sqliteNowMs = sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`;

// ─── Auth ────────────────────────────────────────────────────────────────────

export const user = table(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: integer('email_verified', { mode: 'boolean' })
      .default(false)
      .notNull(),
    image: text('image'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
    utmSource: text('utm_source').notNull().default(''),
    ip: text('ip').notNull().default(''),
    locale: text('locale').notNull().default(''),
  },
  (table) => [
    index('idx_user_name').on(table.name),
    index('idx_user_created_at').on(table.createdAt),
  ]
);

export const session = table(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('idx_session_user_expires').on(table.userId, table.expiresAt),
  ]
);

export const account = table(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_account_user_id').on(table.userId),
    index('idx_account_provider_account').on(table.providerId, table.accountId),
  ]
);

export const verification = table(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('idx_verification_identifier').on(table.identifier)]
);

// ─── Content ─────────────────────────────────────────────────────────────────

export const config = table('config', {
  name: text('name').unique().notNull(),
  value: text('value'),
});

export const pluginMessage = table(
  'plugin_message',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    summary: text('summary').notNull().default(''),
    bodyMarkdown: text('body_markdown').notNull().default(''),
    category: text('category').notNull().default('product'),
    priority: text('priority').notNull().default('normal'),
    status: text('status').notNull().default('draft'),
    actionLabel: text('action_label').notNull().default(''),
    actionUrl: text('action_url').notNull().default(''),
    audienceJson: text('audience_json').notNull().default('{}'),
    isPinned: integer('is_pinned', { mode: 'boolean' })
      .notNull()
      .default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    contentVersion: integer('content_version').notNull().default(1),
    startsAt: integer('starts_at', { mode: 'timestamp_ms' }),
    endsAt: integer('ends_at', { mode: 'timestamp_ms' }),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
    createdBy: text('created_by').notNull().default(''),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_plugin_message_status_window').on(
      table.status,
      table.startsAt,
      table.endsAt
    ),
    index('idx_plugin_message_priority_sort').on(
      table.priority,
      table.sortOrder,
      table.publishedAt
    ),
  ]
);

export const pluginMessageReceipt = table(
  'plugin_message_receipt',
  {
    id: text('id').primaryKey(),
    messageId: text('message_id')
      .notNull()
      .references(() => pluginMessage.id, { onDelete: 'cascade' }),
    subjectKey: text('subject_key').notNull(),
    contentVersion: integer('content_version').notNull().default(1),
    firstImpressionAt: integer('first_impression_at', { mode: 'timestamp_ms' }),
    readAt: integer('read_at', { mode: 'timestamp_ms' }),
    dismissedAt: integer('dismissed_at', { mode: 'timestamp_ms' }),
    actionClickedAt: integer('action_clicked_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('uq_plugin_message_receipt_subject').on(
      table.messageId,
      table.subjectKey
    ),
    index('idx_plugin_message_receipt_subject_read').on(
      table.subjectKey,
      table.readAt
    ),
  ]
);

export const eventLog = table(
  'event_log',
  {
    id: text('id').primaryKey(),
    eventName: text('event_name').notNull(),
    eventVersion: text('event_version').notNull().default('1'),
    project: text('project').notNull().default('mediaclaw_web'),
    source: text('source').notNull().default('server'),
    anonymousId: text('anonymous_id').notNull().default(''),
    userId: text('user_id').notNull().default(''),
    orderNo: text('order_no').notNull().default(''),
    credentialId: text('credential_id').notNull().default(''),
    credentialCode: text('credential_code').notNull().default(''),
    clientUuid: text('client_uuid').notNull().default(''),
    sessionId: text('session_id').notNull().default(''),
    appVersion: text('app_version').notNull().default(''),
    pagePath: text('page_path').notNull().default(''),
    referrer: text('referrer').notNull().default(''),
    utmSource: text('utm_source').notNull().default(''),
    utmMedium: text('utm_medium').notNull().default(''),
    utmCampaign: text('utm_campaign').notNull().default(''),
    utmContent: text('utm_content').notNull().default(''),
    utmTerm: text('utm_term').notNull().default(''),
    channel: text('channel').notNull().default(''),
    landingPage: text('landing_page').notNull().default(''),
    attributionConfidence: text('attribution_confidence').notNull().default(''),
    locale: text('locale').notNull().default(''),
    propertiesJson: text('properties_json'),
    occurredAt: integer('occurred_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    receivedAt: integer('received_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
  },
  (table) => [
    index('idx_event_log_event_occurred').on(table.eventName, table.occurredAt),
    index('idx_event_log_occurred_at').on(table.occurredAt),
    index('idx_event_log_user_occurred').on(table.userId, table.occurredAt),
    index('idx_event_log_anonymous_occurred').on(
      table.anonymousId,
      table.occurredAt
    ),
    index('idx_event_log_page_occurred').on(table.pagePath, table.occurredAt),
  ]
);

export const benefitTask = table(
  'benefit_task',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    taskType: text('task_type').notNull(),
    status: text('status').notNull().default('pending'),
    surveySource: text('survey_source').notNull().default(''),
    surveyRole: text('survey_role').notNull().default(''),
    surveyUseCase: text('survey_use_case').notNull().default(''),
    surveyDetail: text('survey_detail').notNull().default(''),
    entryPoint: text('entry_point').notNull().default(''),
    browserInstallHash: text('browser_install_hash').notNull().default(''),
    rewardType: text('reward_type').notNull().default(''),
    rewardCredentialId: text('reward_credential_id'),
    rewardCredentialCode: text('reward_credential_code'),
    rewardGrantedAt: integer('reward_granted_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('uq_benefit_task_user_task').on(table.userId, table.taskType),
    uniqueIndex('uq_benefit_task_browser_trial')
      .on(table.browserInstallHash, table.taskType)
      .where(
        sql`${table.browserInstallHash} <> '' and ${table.rewardType} = 'trial_code'`
      ),
    index('idx_benefit_task_user_status').on(table.userId, table.status),
    index('idx_benefit_task_browser_hash').on(table.browserInstallHash),
    index('idx_benefit_task_type_status').on(table.taskType, table.status),
  ]
);

export const channelSurveyResponse = table(
  'channel_survey_response',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    source: text('source').notNull().default(''),
    role: text('role').notNull().default(''),
    useCase: text('use_case').notNull().default(''),
    detail: text('detail').notNull().default(''),
    answersJson: text('answers_json').notNull().default('{}'),
    schemaVersion: text('schema_version')
      .notNull()
      .default('channel-survey-v1'),
    rewardLedgerId: text('reward_ledger_id'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_channel_survey_response_user_created').on(
      table.userId,
      table.createdAt
    ),
    index('idx_channel_survey_response_source_created').on(
      table.source,
      table.createdAt
    ),
    index('idx_channel_survey_response_reward_ledger').on(table.rewardLedgerId),
  ]
);

export const experienceFeedbackResponse = table(
  'experience_feedback_response',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment').notNull().default(''),
    expectedFeature: text('expected_feature').notNull().default(''),
    answersJson: text('answers_json').notNull().default('{}'),
    schemaVersion: text('schema_version')
      .notNull()
      .default('experience-feedback-v1'),
    rewardLedgerId: text('reward_ledger_id'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_experience_feedback_user_created').on(
      table.userId,
      table.createdAt
    ),
    index('idx_experience_feedback_rating_created').on(
      table.rating,
      table.createdAt
    ),
    index('idx_experience_feedback_reward_ledger').on(table.rewardLedgerId),
  ]
);

export const benefitRewardLedger = table(
  'benefit_reward_ledger',
  {
    id: text('id').primaryKey(),
    taskType: text('task_type').notNull(),
    sourceResponseId: text('source_response_id').notNull().default(''),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    rewardAction: text('reward_action').notNull(),
    credentialId: text('credential_id'),
    credentialCode: text('credential_code'),
    durationDays: integer('duration_days').notNull().default(0),
    credits: integer('credits').notNull().default(0),
    configSnapshotJson: text('config_snapshot_json').notNull().default('{}'),
    status: text('status').notNull().default('pending'),
    errorMessage: text('error_message').notNull().default(''),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_benefit_reward_user_created').on(table.userId, table.createdAt),
    index('idx_benefit_reward_task_created').on(
      table.taskType,
      table.createdAt
    ),
    index('idx_benefit_reward_credential').on(table.credentialCode),
    index('idx_benefit_reward_status_created').on(
      table.status,
      table.createdAt
    ),
  ]
);

export const welfareUsageSummary = table(
  'welfare_usage_summary',
  {
    id: text('id').primaryKey(),
    credentialId: text('credential_id').references(() => credential.id),
    credentialCode: text('credential_code').notNull(),
    userId: text('user_id').references(() => user.id),
    clientUuid: text('client_uuid').notNull().default(''),
    coreCaptureSuccessCount: integer('core_capture_success_count')
      .notNull()
      .default(0),
    exportOrCopySuccessCount: integer('export_or_copy_success_count')
      .notNull()
      .default(0),
    syncSuccessCount: integer('sync_success_count').notNull().default(0),
    highValueClickCount: integer('high_value_click_count').notNull().default(0),
    failureSignalCount: integer('failure_signal_count').notNull().default(0),
    failureStreak: integer('failure_streak').notNull().default(0),
    totalEventCount: integer('total_event_count').notNull().default(0),
    latestEventType: text('latest_event_type').notNull().default(''),
    metadataJson: text('metadata_json'),
    firstSeenAt: integer('first_seen_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    lastEventAt: integer('last_event_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('welfare_usage_credential_code_key').on(table.credentialCode),
    uniqueIndex('welfare_usage_user_id_key').on(table.userId),
    index('idx_welfare_usage_user_updated_at').on(
      table.userId,
      table.updatedAt
    ),
  ]
);

export const welfareFeedbackTask = table(
  'welfare_feedback_task',
  {
    id: text('id').primaryKey(),
    taskType: text('task_type').notNull().default('usage_feedback'),
    credentialId: text('credential_id').references(() => credential.id),
    credentialCode: text('credential_code').notNull(),
    userId: text('user_id').references(() => user.id),
    clientUuid: text('client_uuid').notNull().default(''),
    rating: integer('rating').notNull().default(0),
    feedbackText: text('feedback_text').notNull().default(''),
    feedbackTextHash: text('feedback_text_hash').notNull().default(''),
    sentiment: text('sentiment').notNull().default('neutral'),
    intent: text('intent').notNull().default('neutral'),
    storeReviewPromptEligible: integer('store_review_prompt_eligible', {
      mode: 'boolean',
    })
      .notNull()
      .default(false),
    rewardType: text('reward_type').notNull().default('credential_extension'),
    rewardDays: integer('reward_days').notNull().default(3),
    rewardCredentialId: text('reward_credential_id'),
    rewardCredentialCode: text('reward_credential_code'),
    rewardGrantedAt: integer('reward_granted_at', { mode: 'timestamp_ms' }),
    status: text('status').notNull().default('completed'),
    metadataJson: text('metadata_json'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('welfare_feedback_credential_task_key').on(
      table.credentialCode,
      table.taskType
    ),
    uniqueIndex('welfare_feedback_user_task_key').on(
      table.userId,
      table.taskType
    ),
    index('idx_welfare_feedback_user_created_at').on(
      table.userId,
      table.createdAt
    ),
  ]
);

export const userSyncTarget = table(
  'user_sync_target',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    targetJson: text('target_json').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('user_sync_target_user_id_unique').on(table.userId),
    index('idx_user_sync_target_user_id').on(table.userId),
  ]
);

export const userMonitorSetting = table(
  'user_monitor_setting',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    publishWindow: text('publish_window').notNull().default('previous_day'),
    likeThreshold: integer('like_threshold').notNull().default(0),
    runTimesJson: text('run_times_json').notNull().default('["10:00"]'),
    observeWindowHours: integer('observe_window_hours').notNull().default(48),
    timezone: text('timezone').notNull().default('Asia/Shanghai'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('user_monitor_setting_user_id_unique').on(table.userId),
    index('idx_user_monitor_setting_user_id').on(table.userId),
  ]
);

export const monitorSubscription = table(
  'monitor_subscription',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    platform: text('platform').notNull(),
    platformBloggerId: text('platform_blogger_id').notNull(),
    bloggerNameSnapshot: text('blogger_name_snapshot'),
    bloggerAvatarSnapshot: text('blogger_avatar_snapshot'),
    bloggerUrl: text('blogger_url'),
    frequency: text('frequency').notNull().default('daily'),
    lookbackHours: integer('lookback_hours').notNull().default(24),
    likeThreshold: integer('like_threshold').notNull().default(100),
    status: text('status').notNull().default('active'),
    lastRunAt: integer('last_run_at', { mode: 'timestamp_ms' }),
    nextRunAt: integer('next_run_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    lastHitAt: integer('last_hit_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_monitor_subscription_user_status_next_run').on(
      table.userId,
      table.status,
      table.nextRunAt
    ),
    uniqueIndex('monitor_subscription_user_platform_blogger_unique').on(
      table.userId,
      table.platform,
      table.platformBloggerId
    ),
  ]
);

export const monitorExecution = table(
  'monitor_execution',
  {
    id: text('id').primaryKey(),
    subscriptionId: text('subscription_id')
      .notNull()
      .references(() => monitorSubscription.id),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    billingCredentialId: text('billing_credential_id').references(
      () => credential.id
    ),
    status: text('status').notNull(),
    lookbackHours: integer('lookback_hours').notNull(),
    likeThreshold: integer('like_threshold').notNull(),
    scannedCount: integer('scanned_count').notNull().default(0),
    hitCount: integer('hit_count').notNull().default(0),
    costCredits: integer('cost_credits').notNull().default(0),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    errorDetailJson: text('error_detail_json'),
    batchId: text('batch_id'),
    platform: text('platform'),
    bloggerName: text('blogger_name'),
    bloggerUrl: text('blogger_url'),
    startedAt: integer('started_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    finishedAt: integer('finished_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_monitor_execution_subscription_started_at').on(
      table.subscriptionId,
      table.startedAt
    ),
    index('idx_monitor_execution_user_started_at').on(
      table.userId,
      table.startedAt
    ),
  ]
);

export const monitorHit = table(
  'monitor_hit',
  {
    id: text('id').primaryKey(),
    subscriptionId: text('subscription_id')
      .notNull()
      .references(() => monitorSubscription.id),
    executionId: text('execution_id')
      .notNull()
      .references(() => monitorExecution.id),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    platform: text('platform').notNull(),
    platformContentId: text('platform_content_id').notNull(),
    contentUrl: text('content_url'),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
    likes: integer('likes').notNull().default(0),
    bloggerName: text('blogger_name'),
    bloggerUrl: text('blogger_url'),
    payloadJson: text('payload_json'),
    aiStatus: text('ai_status').notNull().default('pending'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
  },
  (table) => [
    uniqueIndex('monitor_hit_subscription_platform_content_unique').on(
      table.subscriptionId,
      table.platformContentId
    ),
    index('idx_monitor_hit_user_created_at').on(table.userId, table.createdAt),
  ]
);

export const taxonomy = table(
  'taxonomy',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    parentId: text('parent_id'),
    slug: text('slug').unique().notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    image: text('image'),
    icon: text('icon'),
    status: text('status').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
    sort: integer('sort').default(0).notNull(),
  },
  (table) => [index('idx_taxonomy_type_status').on(table.type, table.status)]
);

export const post = table(
  'post',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    parentId: text('parent_id'),
    slug: text('slug').unique().notNull(),
    type: text('type').notNull(),
    title: text('title'),
    description: text('description'),
    image: text('image'),
    content: text('content'),
    categories: text('categories'),
    tags: text('tags'),
    authorName: text('author_name'),
    authorImage: text('author_image'),
    status: text('status').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
    sort: integer('sort').default(0).notNull(),
  },
  (table) => [index('idx_post_type_status').on(table.type, table.status)]
);

// ─── Business ────────────────────────────────────────────────────────────────

export const order = table(
  'order',
  {
    id: text('id').primaryKey(),
    orderNo: text('order_no').unique().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    userEmail: text('user_email'),
    status: text('status').notNull(),
    amount: integer('amount').notNull(),
    currency: text('currency').notNull(),
    productId: text('product_id'),
    paymentType: text('payment_type'),
    paymentInterval: text('payment_interval'),
    paymentProvider: text('payment_provider').notNull(),
    paymentSessionId: text('payment_session_id'),
    checkoutInfo: text('checkout_info').notNull(),
    checkoutResult: text('checkout_result'),
    paymentResult: text('payment_result'),
    discountCode: text('discount_code'),
    discountAmount: integer('discount_amount'),
    discountCurrency: text('discount_currency'),
    deductionReservationKey: text('deduction_reservation_key'),
    paymentEmail: text('payment_email'),
    paymentAmount: integer('payment_amount'),
    paymentCurrency: text('payment_currency'),
    paidAt: integer('paid_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
    description: text('description'),
    productName: text('product_name'),
    subscriptionId: text('subscription_id'),
    subscriptionResult: text('subscription_result'),
    checkoutUrl: text('checkout_url'),
    callbackUrl: text('callback_url'),
    creditsAmount: integer('credits_amount'),
    creditsValidDays: integer('credits_valid_days'),
    planName: text('plan_name'),
    paymentProductId: text('payment_product_id'),
    invoiceId: text('invoice_id'),
    invoiceUrl: text('invoice_url'),
    subscriptionNo: text('subscription_no'),
    transactionId: text('transaction_id'),
    paymentUserName: text('payment_user_name'),
    paymentUserId: text('payment_user_id'),
    credentialAction: text('credential_action').notNull().default('none'),
    credentialSyncStatus: text('credential_sync_status')
      .notNull()
      .default('pending'),
    credentialProcessedAt: integer('credential_processed_at', {
      mode: 'timestamp_ms',
    }),
    credentialSyncError: text('credential_sync_error'),
    credentialCode: text('credential_code'),
    partnerId: text('partner_id'),
    variantId: text('variant_id'),
    seatCount: integer('seat_count').notNull().default(1),
    priceRuleSnapshot: text('price_rule_snapshot'),
    starterBrowserInstallHash: text('starter_browser_install_hash')
      .notNull()
      .default(''),
    attributionAnonymousId: text('attribution_anonymous_id')
      .notNull()
      .default(''),
    attributionSessionId: text('attribution_session_id').notNull().default(''),
    attributionChannel: text('attribution_channel').notNull().default(''),
    attributionSource: text('attribution_source').notNull().default(''),
    attributionMedium: text('attribution_medium').notNull().default(''),
    attributionCampaign: text('attribution_campaign').notNull().default(''),
    attributionContent: text('attribution_content').notNull().default(''),
    attributionReferrer: text('attribution_referrer').notNull().default(''),
    attributionLandingPage: text('attribution_landing_page')
      .notNull()
      .default(''),
    attributionConfidence: text('attribution_confidence').notNull().default(''),
    attributionSnapshot: text('attribution_snapshot'),
  },
  (table) => [
    index('idx_order_user_status_payment_type').on(
      table.userId,
      table.status,
      table.paymentType
    ),
    index('idx_order_transaction_provider').on(
      table.transactionId,
      table.paymentProvider
    ),
    index('idx_order_created_at').on(table.createdAt),
    index('idx_order_admin_status_created').on(table.status, table.createdAt),
    index('idx_order_admin_payment_created').on(
      table.paymentType,
      table.createdAt
    ),
    index('idx_order_status_paid_at').on(table.status, table.paidAt),
    index('idx_order_starter_browser').on(
      table.starterBrowserInstallHash,
      table.productId,
      table.status
    ),
    uniqueIndex('uq_order_deduction_reservation').on(
      table.deductionReservationKey
    ),
  ]
);

export const subscription = table(
  'subscription',
  {
    id: text('id').primaryKey(),
    subscriptionNo: text('subscription_no').unique().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    userEmail: text('user_email'),
    status: text('status').notNull(),
    paymentProvider: text('payment_provider').notNull(),
    subscriptionId: text('subscription_id').notNull(),
    subscriptionResult: text('subscription_result'),
    productId: text('product_id'),
    description: text('description'),
    amount: integer('amount'),
    currency: text('currency'),
    interval: text('interval'),
    intervalCount: integer('interval_count'),
    trialPeriodDays: integer('trial_period_days'),
    currentPeriodStart: integer('current_period_start', {
      mode: 'timestamp_ms',
    }),
    currentPeriodEnd: integer('current_period_end', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
    planName: text('plan_name'),
    billingUrl: text('billing_url'),
    productName: text('product_name'),
    creditsAmount: integer('credits_amount'),
    creditsValidDays: integer('credits_valid_days'),
    paymentProductId: text('payment_product_id'),
    paymentUserId: text('payment_user_id'),
    canceledAt: integer('canceled_at', { mode: 'timestamp_ms' }),
    canceledEndAt: integer('canceled_end_at', { mode: 'timestamp_ms' }),
    canceledReason: text('canceled_reason'),
    canceledReasonType: text('canceled_reason_type'),
  },
  (table) => [
    index('idx_subscription_user_status_interval').on(
      table.userId,
      table.status,
      table.interval
    ),
    index('idx_subscription_provider_id').on(
      table.subscriptionId,
      table.paymentProvider
    ),
    index('idx_subscription_created_at').on(table.createdAt),
    index('idx_subscription_admin_status_created').on(
      table.status,
      table.createdAt
    ),
    index('idx_subscription_admin_interval_created').on(
      table.interval,
      table.createdAt
    ),
  ]
);

export const credit = table(
  'credit',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    userEmail: text('user_email'),
    orderNo: text('order_no'),
    subscriptionNo: text('subscription_no'),
    transactionNo: text('transaction_no').unique().notNull(),
    transactionType: text('transaction_type').notNull(),
    transactionScene: text('transaction_scene'),
    credits: integer('credits').notNull(),
    remainingCredits: integer('remaining_credits').notNull().default(0),
    description: text('description'),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
    status: text('status').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
    consumedDetail: text('consumed_detail'),
    metadata: text('metadata'),
    credentialCode: text('credential_code'),
  },
  (table) => [
    index('idx_credit_consume_fifo').on(
      table.userId,
      table.status,
      table.transactionType,
      table.remainingCredits,
      table.expiresAt
    ),
    index('idx_credit_order_no').on(table.orderNo),
    index('idx_credit_subscription_no').on(table.subscriptionNo),
    index('idx_credit_admin_status_type_created').on(
      table.status,
      table.transactionType,
      table.createdAt
    ),
  ]
);

export const credential = table(
  'credential',
  {
    id: text('id').primaryKey(),
    code: text('code').unique().notNull(),
    ownerUserId: text('owner_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    sourceOrderNo: text('source_order_no'),
    planCode: text('plan_code'),
    durationPreset: text('duration_preset'),
    maxBindings: integer('max_bindings').notNull().default(1),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
    status: text('status').notNull().default('active'),
    partnerId: text('partner_id'),
    variantId: text('variant_id'),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_credential_owner_status').on(table.ownerUserId, table.status),
    index('idx_credential_source_order').on(table.sourceOrderNo),
    index('idx_credential_partner').on(table.partnerId, table.variantId),
    index('idx_credential_admin_deleted_created').on(
      table.deletedAt,
      table.createdAt
    ),
    index('idx_credential_admin_deleted_status_created').on(
      table.deletedAt,
      table.status,
      table.createdAt
    ),
  ]
);

export const credentialCredit = table(
  'credential_credit',
  {
    id: text('id').primaryKey(),
    credentialId: text('credential_id'),
    credentialCode: text('credential_code').notNull(),
    userId: text('user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    orderNo: text('order_no'),
    totalCredits: integer('total_credits').notNull().default(0),
    usedCredits: integer('used_credits').notNull().default(0),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
    status: text('status').notNull().default('active'),
    activatedAt: integer('activated_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_credential_credit_code').on(table.credentialCode),
    index('idx_credential_credit_user_status').on(table.userId, table.status),
  ]
);

export const referralAccount = table(
  'referral_account',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    inviteCode: text('invite_code').unique().notNull(),
    status: text('status').notNull().default('active'),
    totalInvitees: integer('total_invitees').notNull().default(0),
    totalCommission: integer('total_commission').notNull().default(0),
    availableCommission: integer('available_commission').notNull().default(0),
    pendingCommission: integer('pending_commission').notNull().default(0),
    withdrawnCommission: integer('withdrawn_commission').notNull().default(0),
    currency: text('currency').notNull().default('usd'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_referral_account_user').on(table.userId),
    index('idx_referral_account_code').on(table.inviteCode),
  ]
);

export const referralRelation = table(
  'referral_relation',
  {
    id: text('id').primaryKey(),
    referrerId: text('referrer_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    refereeId: text('referee_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    referralCode: text('referral_code').notNull(),
    hasFirstOrder: integer('has_first_order', { mode: 'boolean' })
      .notNull()
      .default(false),
    firstOrderNo: text('first_order_no'),
    firstOrderAt: integer('first_order_at', { mode: 'timestamp_ms' }),
    status: text('status').notNull().default('active'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_referral_relation_referrer').on(table.referrerId),
    index('idx_referral_relation_referee').on(table.refereeId),
    index('idx_referral_relation_code').on(table.referralCode),
  ]
);

export const referralCommission = table(
  'referral_commission',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'),
    relationId: text('relation_id'),
    referrerUserId: text('referrer_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    inviteeUserId: text('invitee_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    orderNo: text('order_no'),
    orderAmount: integer('order_amount').notNull().default(0),
    orderCurrency: text('order_currency').notNull().default('usd'),
    commissionRate: integer('commission_rate').notNull().default(0),
    commissionAmount: integer('commission_amount').notNull().default(0),
    commissionCurrency: text('commission_currency').notNull().default('usd'),
    commissionType: text('commission_type').notNull().default('first_order'),
    amount: integer('amount').notNull().default(0),
    currency: text('currency').notNull().default('usd'),
    rate: integer('rate').notNull().default(0),
    status: text('status').notNull().default('pending'),
    reason: text('reason'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_referral_commission_referrer').on(
      table.referrerUserId,
      table.status
    ),
    index('idx_referral_commission_order').on(table.orderNo),
  ]
);

export const referralWithdrawal = table(
  'referral_withdrawal',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    currency: text('currency').notNull().default('usd'),
    status: text('status').notNull().default('pending'),
    accountInfo: text('account_info'),
    reviewerUserId: text('reviewer_user_id'),
    reviewedAt: integer('reviewed_at', { mode: 'timestamp_ms' }),
    reason: text('reason'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_referral_withdrawal_user_status').on(table.userId, table.status),
    index('idx_referral_withdrawal_status').on(table.status),
  ]
);

export const referralRiskLog = table(
  'referral_risk_log',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    riskType: text('risk_type').notNull(),
    riskLevel: text('risk_level').notNull().default('low'),
    details: text('details'),
    action: text('action'),
    resolvedAt: integer('resolved_at', { mode: 'timestamp_ms' }),
    resolvedBy: text('resolved_by'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
  },
  (table) => [
    index('idx_referral_risk_log_user').on(table.userId),
    index('idx_referral_risk_log_type').on(table.riskType, table.createdAt),
  ]
);

export const partner = table(
  'partner',
  {
    id: text('id').primaryKey(),
    partnerCode: text('partner_code').unique().notNull(),
    name: text('name').notNull(),
    type: text('type').notNull().default('supplier'),
    status: text('status').notNull().default('active'),
    ownerUserId: text('owner_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    ownerEmail: text('owner_email'),
    variantId: text('variant_id'),
    contractStatus: text('contract_status').notNull().default('draft'),
    seatLimit: integer('seat_limit').notNull().default(0),
    usedSeats: integer('used_seats').notNull().default(0),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_partner_code').on(table.partnerCode),
    index('idx_partner_owner').on(table.ownerUserId),
    index('idx_partner_status').on(table.status),
  ]
);

export const apikey = table(
  'apikey',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    keyHash: text('key_hash').notNull(),
    keyPrefix: text('key_prefix').notNull(),
    title: text('title').notNull(),
    status: text('status').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_apikey_user_status').on(table.userId, table.status),
    index('idx_apikey_keyhash_status').on(table.keyHash, table.status),
  ]
);

// ─── RBAC ────────────────────────────────────────────────────────────────────

export const role = table(
  'role',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
    sort: integer('sort').default(0).notNull(),
  },
  (table) => [index('idx_role_status').on(table.status)]
);

export const permission = table(
  'permission',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),
    resource: text('resource').notNull(),
    action: text('action').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_permission_resource_action').on(table.resource, table.action),
  ]
);

export const rolePermission = table(
  'role_permission',
  {
    id: text('id').primaryKey(),
    roleId: text('role_id')
      .notNull()
      .references(() => role.id, { onDelete: 'cascade' }),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permission.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_role_permission_role_permission').on(
      table.roleId,
      table.permissionId
    ),
  ]
);

export const userRole = table(
  'user_role',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    roleId: text('role_id')
      .notNull()
      .references(() => role.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_user_role_user_expires').on(table.userId, table.expiresAt),
  ]
);

// ─── AI ──────────────────────────────────────────────────────────────────────

export const aiTask = table(
  'ai_task',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    mediaType: text('media_type').notNull(),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    prompt: text('prompt').notNull(),
    options: text('options'),
    status: text('status').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
    taskId: text('task_id'),
    taskInfo: text('task_info'),
    taskResult: text('task_result'),
    costCredits: integer('cost_credits').notNull().default(0),
    scene: text('scene').notNull().default(''),
    creditId: text('credit_id'),
  },
  (table) => [
    index('idx_ai_task_user_media_type').on(table.userId, table.mediaType),
    index('idx_ai_task_media_type_status').on(table.mediaType, table.status),
  ]
);

export const chat = table(
  'chat',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
    model: text('model').notNull(),
    provider: text('provider').notNull(),
    title: text('title').notNull().default(''),
    parts: text('parts').notNull(),
    metadata: text('metadata'),
    content: text('content'),
  },
  (table) => [index('idx_chat_user_status').on(table.userId, table.status)]
);

export const chatMessage = table(
  'chat_message',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    chatId: text('chat_id')
      .notNull()
      .references(() => chat.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
    role: text('role').notNull(),
    parts: text('parts').notNull(),
    metadata: text('metadata'),
    model: text('model').notNull(),
    provider: text('provider').notNull(),
  },
  (table) => [
    index('idx_chat_message_chat_id').on(table.chatId, table.status),
    index('idx_chat_message_user_id').on(table.userId, table.status),
  ]
);

// ─── Types ───────────────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Verification = typeof verification.$inferSelect;
export type Config = typeof config.$inferSelect;
export type EventLog = typeof eventLog.$inferSelect;
export type NewEventLog = typeof eventLog.$inferInsert;
export type BenefitTask = typeof benefitTask.$inferSelect;
export type ChannelSurveyResponse = typeof channelSurveyResponse.$inferSelect;
export type ExperienceFeedbackResponse =
  typeof experienceFeedbackResponse.$inferSelect;
export type BenefitRewardLedger = typeof benefitRewardLedger.$inferSelect;
export type WelfareUsageSummary = typeof welfareUsageSummary.$inferSelect;
export type WelfareFeedbackTask = typeof welfareFeedbackTask.$inferSelect;
export type Taxonomy = typeof taxonomy.$inferSelect;
export type NewTaxonomy = typeof taxonomy.$inferInsert;
export type Post = typeof post.$inferSelect;
export type NewPost = typeof post.$inferInsert;
export type Order = typeof order.$inferSelect;
export type NewOrder = typeof order.$inferInsert;
export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;
export type Credit = typeof credit.$inferSelect;
export type NewCredit = typeof credit.$inferInsert;
export type Apikey = typeof apikey.$inferSelect;
export type NewApikey = typeof apikey.$inferInsert;
export type Role = typeof role.$inferSelect;
export type NewRole = typeof role.$inferInsert;
export type Permission = typeof permission.$inferSelect;
export type RolePermission = typeof rolePermission.$inferSelect;
export type UserRole = typeof userRole.$inferSelect;
export type AiTask = typeof aiTask.$inferSelect;
export type NewAiTask = typeof aiTask.$inferInsert;
export type Chat = typeof chat.$inferSelect;
export type NewChat = typeof chat.$inferInsert;
export type ChatMessage = typeof chatMessage.$inferSelect;
export type NewChatMessage = typeof chatMessage.$inferInsert;
export type ReferralAccount = typeof referralAccount.$inferSelect;
export type NewReferralAccount = typeof referralAccount.$inferInsert;
export type ReferralRelation = typeof referralRelation.$inferSelect;
export type NewReferralRelation = typeof referralRelation.$inferInsert;
export type ReferralCommission = typeof referralCommission.$inferSelect;
export type NewReferralCommission = typeof referralCommission.$inferInsert;
export type ReferralWithdrawal = typeof referralWithdrawal.$inferSelect;
export type NewReferralWithdrawal = typeof referralWithdrawal.$inferInsert;
export type ReferralRiskLog = typeof referralRiskLog.$inferSelect;

// ─── Tickets (support) ───────────────────────────────────────────────────────

export const ticket = table(
  'ticket',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    title: text('title').notNull(),
    status: text('status').notNull().default('open'), // open | replied | closed
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index('idx_ticket_user').on(t.userId),
    index('idx_ticket_status').on(t.status),
  ]
);

export const ticketMessage = table(
  'ticket_message',
  {
    id: text('id').primaryKey(),
    ticketId: text('ticket_id')
      .notNull()
      .references(() => ticket.id),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    role: text('role').notNull().default('user'), // user | admin
    content: text('content').notNull(),
    attachments: text('attachments').notNull().default('[]'), // JSON array of image URLs
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('idx_ticket_message_ticket').on(t.ticketId)]
);

export type Ticket = typeof ticket.$inferSelect;
export type NewTicket = typeof ticket.$inferInsert;
export type TicketMessage = typeof ticketMessage.$inferSelect;
export type NewTicketMessage = typeof ticketMessage.$inferInsert;

// ─── Custom tables ───────────────────────────────────────────────────────────
// Add your own tables below this line.

// Account analysis keeps the human-readable report and only the representative
// evidence index needed by the report. Full scraped-note media stays in the
// extension/data pool instead of being duplicated here.
export const accountStyleProfile = table(
  'account_style_profile',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    platform: text('platform').notNull(),
    platformBloggerId: text('platform_blogger_id').notNull(),
    bloggerName: text('blogger_name'),
    bloggerUrl: text('blogger_url'),
    sourceType: text('source_type').notNull().default('standard'),
    sampleCount: integer('sample_count').notNull().default(0),
    detailSampleCount: integer('detail_sample_count').notNull().default(0),
    commentSampleCount: integer('comment_sample_count').notNull().default(0),
    confidenceLevel: text('confidence_level').notNull().default('medium'),
    profileJson: text('profile_json').notNull().default('{}'),
    editableJson: text('editable_json').notNull().default('{}'),
    sampleSummaryJson: text('sample_summary_json').notNull().default('{}'),
    lastAnalyzedAt: integer('last_analyzed_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sqliteNowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('account_style_profile_user_platform_blogger_unique').on(
      table.userId,
      table.platform,
      table.platformBloggerId
    ),
    index('idx_account_style_profile_user_updated').on(
      table.userId,
      table.updatedAt
    ),
  ]
);

export type AccountStyleProfile = typeof accountStyleProfile.$inferSelect;
export type NewAccountStyleProfile = typeof accountStyleProfile.$inferInsert;

// ─── Invite Codes ────────────────────────────────────────────────────────────

export const inviteCode = table(
  'invite_code',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),
    maxUses: integer('max_uses').notNull().default(1),
    usedCount: integer('used_count').notNull().default(0),
    trialDays: integer('trial_days').notNull().default(15),
    note: text('note').default(''),
    createdBy: text('created_by').references(() => user.id),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('idx_invite_code_code').on(t.code)]
);

export const userInvite = table(
  'user_invite',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    inviteCodeId: text('invite_code_id')
      .notNull()
      .references(() => inviteCode.id),
    activatedAt: integer('activated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    trialEndsAt: integer('trial_ends_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => [
    index('idx_user_invite_user').on(t.userId),
    index('idx_user_invite_code').on(t.inviteCodeId),
  ]
);

export type InviteCode = typeof inviteCode.$inferSelect;
export type NewInviteCode = typeof inviteCode.$inferInsert;
export type UserInvite = typeof userInvite.$inferSelect;
export type NewUserInvite = typeof userInvite.$inferInsert;
