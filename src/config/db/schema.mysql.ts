/**
 * MySQL schema definitions.
 *
 * This is the MySQL dialect of the database schema.
 * To use: set DATABASE_PROVIDER=mysql in .env.local,
 * then copy this file's content into schema.ts.
 */

import {
  boolean,
  index,
  int,
  longtext,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

const table = mysqlTable;

const varchar191 = (name: string) => varchar(name, { length: 191 });

// ─── Auth ────────────────────────────────────────────────────────────────────

export const user = table(
  'user',
  {
    id: varchar191('id').primaryKey(),
    name: varchar191('name').notNull(),
    email: varchar191('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    utmSource: varchar('utm_source', { length: 100 }).notNull().default(''),
    ip: varchar('ip', { length: 45 }).notNull().default(''),
    locale: varchar('locale', { length: 20 }).notNull().default(''),
  },
  (table) => [
    index('idx_user_name').on(table.name),
    index('idx_user_created_at').on(table.createdAt),
  ]
);

export const session = table(
  'session',
  {
    id: varchar191('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: varchar191('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    userId: varchar191('user_id')
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
    id: varchar191('id').primaryKey(),
    accountId: varchar191('account_id').notNull(),
    providerId: varchar('provider_id', { length: 50 }).notNull(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: varchar('scope', { length: 255 }),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('idx_account_user_id').on(table.userId),
    index('idx_account_provider_account').on(table.providerId, table.accountId),
  ]
);

export const verification = table(
  'verification',
  {
    id: varchar191('id').primaryKey(),
    identifier: varchar191('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index('idx_verification_identifier').on(table.identifier)]
);

// ─── Content ─────────────────────────────────────────────────────────────────

export const config = table('config', {
  name: varchar191('name').unique().notNull(),
  value: text('value'),
});

export const eventLog = table(
  'event_log',
  {
    id: varchar191('id').primaryKey(),
    eventName: varchar('event_name', { length: 120 }).notNull(),
    eventVersion: varchar('event_version', { length: 20 })
      .notNull()
      .default('1'),
    project: varchar('project', { length: 80 })
      .notNull()
      .default('mediaclaw_web'),
    source: varchar('source', { length: 80 }).notNull().default('server'),
    anonymousId: varchar191('anonymous_id').notNull().default(''),
    userId: varchar191('user_id').notNull().default(''),
    orderNo: varchar191('order_no').notNull().default(''),
    credentialId: varchar191('credential_id').notNull().default(''),
    credentialCode: varchar191('credential_code').notNull().default(''),
    clientUuid: varchar191('client_uuid').notNull().default(''),
    sessionId: varchar191('session_id').notNull().default(''),
    appVersion: varchar('app_version', { length: 80 }).notNull().default(''),
    pagePath: text('page_path').notNull().default(''),
    referrer: text('referrer').notNull().default(''),
    utmSource: varchar('utm_source', { length: 120 }).notNull().default(''),
    utmMedium: varchar('utm_medium', { length: 120 }).notNull().default(''),
    utmCampaign: varchar('utm_campaign', { length: 120 }).notNull().default(''),
    utmContent: varchar('utm_content', { length: 120 }).notNull().default(''),
    utmTerm: varchar('utm_term', { length: 120 }).notNull().default(''),
    channel: varchar('channel', { length: 120 }).notNull().default(''),
    landingPage: text('landing_page').notNull().default(''),
    attributionConfidence: varchar('attribution_confidence', { length: 40 })
      .notNull()
      .default(''),
    locale: varchar('locale', { length: 20 }).notNull().default(''),
    propertiesJson: longtext('properties_json'),
    occurredAt: timestamp('occurred_at').defaultNow().notNull(),
    receivedAt: timestamp('received_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_event_log_event_occurred').on(table.eventName, table.occurredAt),
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
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    taskType: varchar('task_type', { length: 80 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    surveySource: text('survey_source').notNull().default(''),
    surveyRole: text('survey_role').notNull().default(''),
    surveyUseCase: text('survey_use_case').notNull().default(''),
    surveyDetail: text('survey_detail').notNull().default(''),
    entryPoint: text('entry_point').notNull().default(''),
    browserInstallHash: varchar191('browser_install_hash')
      .notNull()
      .default(''),
    rewardType: varchar('reward_type', { length: 50 }).notNull().default(''),
    rewardCredentialId: varchar191('reward_credential_id'),
    rewardCredentialCode: varchar191('reward_credential_code'),
    rewardGrantedAt: timestamp('reward_granted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_benefit_task_user_task').on(table.userId, table.taskType),
    index('idx_benefit_task_user_status').on(table.userId, table.status),
    index('idx_benefit_task_browser_hash').on(table.browserInstallHash),
    index('idx_benefit_task_type_status').on(table.taskType, table.status),
  ]
);

export const channelSurveyResponse = table(
  'channel_survey_response',
  {
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    source: text('source').notNull().default(''),
    role: text('role').notNull().default(''),
    useCase: text('use_case').notNull().default(''),
    detail: text('detail').notNull().default(''),
    answersJson: longtext('answers_json').notNull().default('{}'),
    schemaVersion: varchar('schema_version', { length: 80 })
      .notNull()
      .default('channel-survey-v1'),
    rewardLedgerId: varchar191('reward_ledger_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
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
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    rating: int('rating').notNull(),
    comment: text('comment').notNull().default(''),
    expectedFeature: text('expected_feature').notNull().default(''),
    answersJson: longtext('answers_json').notNull().default('{}'),
    schemaVersion: varchar('schema_version', { length: 80 })
      .notNull()
      .default('experience-feedback-v1'),
    rewardLedgerId: varchar191('reward_ledger_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
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
    id: varchar191('id').primaryKey(),
    taskType: varchar('task_type', { length: 80 }).notNull(),
    sourceResponseId: varchar191('source_response_id').notNull().default(''),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    rewardAction: varchar('reward_action', { length: 80 }).notNull(),
    credentialId: varchar191('credential_id'),
    credentialCode: varchar191('credential_code'),
    durationDays: int('duration_days').notNull().default(0),
    credits: int('credits').notNull().default(0),
    configSnapshotJson: longtext('config_snapshot_json')
      .notNull()
      .default('{}'),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    errorMessage: text('error_message').notNull().default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
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
    id: varchar191('id').primaryKey(),
    credentialId: varchar191('credential_id').references(() => credential.id),
    credentialCode: varchar191('credential_code').notNull(),
    userId: varchar191('user_id').references(() => user.id),
    clientUuid: varchar191('client_uuid').notNull().default(''),
    coreCaptureSuccessCount: int('core_capture_success_count')
      .notNull()
      .default(0),
    exportOrCopySuccessCount: int('export_or_copy_success_count')
      .notNull()
      .default(0),
    syncSuccessCount: int('sync_success_count').notNull().default(0),
    highValueClickCount: int('high_value_click_count').notNull().default(0),
    failureSignalCount: int('failure_signal_count').notNull().default(0),
    failureStreak: int('failure_streak').notNull().default(0),
    totalEventCount: int('total_event_count').notNull().default(0),
    latestEventType: varchar('latest_event_type', { length: 120 })
      .notNull()
      .default(''),
    metadataJson: longtext('metadata_json'),
    firstSeenAt: timestamp('first_seen_at').defaultNow().notNull(),
    lastEventAt: timestamp('last_event_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
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
    id: varchar191('id').primaryKey(),
    taskType: varchar('task_type', { length: 80 })
      .notNull()
      .default('usage_feedback'),
    credentialId: varchar191('credential_id').references(() => credential.id),
    credentialCode: varchar191('credential_code').notNull(),
    userId: varchar191('user_id').references(() => user.id),
    clientUuid: varchar191('client_uuid').notNull().default(''),
    rating: int('rating').notNull().default(0),
    feedbackText: text('feedback_text').notNull().default(''),
    feedbackTextHash: varchar191('feedback_text_hash').notNull().default(''),
    sentiment: varchar('sentiment', { length: 80 })
      .notNull()
      .default('neutral'),
    intent: varchar('intent', { length: 80 }).notNull().default('neutral'),
    storeReviewPromptEligible: boolean('store_review_prompt_eligible')
      .notNull()
      .default(false),
    rewardType: varchar('reward_type', { length: 80 })
      .notNull()
      .default('credential_extension'),
    rewardDays: int('reward_days').notNull().default(3),
    rewardCredentialId: varchar191('reward_credential_id'),
    rewardCredentialCode: varchar191('reward_credential_code'),
    rewardGrantedAt: timestamp('reward_granted_at'),
    status: varchar('status', { length: 50 }).notNull().default('completed'),
    metadataJson: longtext('metadata_json'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
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

export const taxonomy = table(
  'taxonomy',
  {
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    parentId: varchar191('parent_id'),
    slug: varchar191('slug').unique().notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    image: text('image'),
    icon: varchar191('icon'),
    status: varchar('status', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    sort: int('sort').default(0).notNull(),
  },
  (table) => [index('idx_taxonomy_type_status').on(table.type, table.status)]
);

export const post = table(
  'post',
  {
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    parentId: varchar191('parent_id'),
    slug: varchar191('slug').unique().notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }),
    description: text('description'),
    image: text('image'),
    content: longtext('content'),
    categories: text('categories'),
    tags: text('tags'),
    authorName: varchar191('author_name'),
    authorImage: text('author_image'),
    status: varchar('status', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    sort: int('sort').default(0).notNull(),
  },
  (table) => [index('idx_post_type_status').on(table.type, table.status)]
);

// ─── Business ────────────────────────────────────────────────────────────────

export const order = table(
  'order',
  {
    id: varchar191('id').primaryKey(),
    orderNo: varchar191('order_no').unique().notNull(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    userEmail: varchar191('user_email'),
    status: varchar('status', { length: 50 }).notNull(),
    amount: int('amount').notNull(),
    currency: varchar('currency', { length: 10 }).notNull(),
    productId: varchar191('product_id'),
    paymentType: varchar('payment_type', { length: 50 }),
    paymentInterval: varchar('payment_interval', { length: 50 }),
    paymentProvider: varchar('payment_provider', { length: 50 }).notNull(),
    paymentSessionId: varchar191('payment_session_id'),
    checkoutInfo: text('checkout_info').notNull(),
    checkoutResult: text('checkout_result'),
    paymentResult: text('payment_result'),
    discountCode: varchar191('discount_code'),
    discountAmount: int('discount_amount'),
    discountCurrency: varchar('discount_currency', { length: 10 }),
    paymentEmail: varchar191('payment_email'),
    paymentAmount: int('payment_amount'),
    paymentCurrency: varchar('payment_currency', { length: 10 }),
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    description: text('description'),
    productName: varchar('product_name', { length: 255 }),
    subscriptionId: varchar191('subscription_id'),
    subscriptionResult: text('subscription_result'),
    checkoutUrl: text('checkout_url'),
    callbackUrl: text('callback_url'),
    creditsAmount: int('credits_amount'),
    creditsValidDays: int('credits_valid_days'),
    planName: varchar191('plan_name'),
    paymentProductId: varchar191('payment_product_id'),
    invoiceId: varchar191('invoice_id'),
    invoiceUrl: text('invoice_url'),
    subscriptionNo: varchar191('subscription_no'),
    transactionId: varchar191('transaction_id'),
    paymentUserName: varchar191('payment_user_name'),
    paymentUserId: varchar191('payment_user_id'),
    credentialAction: varchar('credential_action', { length: 50 })
      .notNull()
      .default('none'),
    credentialSyncStatus: varchar('credential_sync_status', { length: 50 })
      .notNull()
      .default('pending'),
    credentialProcessedAt: timestamp('credential_processed_at'),
    credentialSyncError: text('credential_sync_error'),
    credentialCode: varchar191('credential_code'),
    partnerId: varchar191('partner_id'),
    variantId: varchar191('variant_id'),
    seatCount: int('seat_count').notNull().default(1),
    priceRuleSnapshot: text('price_rule_snapshot'),
    attributionAnonymousId: varchar191('attribution_anonymous_id')
      .notNull()
      .default(''),
    attributionSessionId: varchar191('attribution_session_id')
      .notNull()
      .default(''),
    attributionChannel: varchar('attribution_channel', { length: 120 })
      .notNull()
      .default(''),
    attributionSource: varchar('attribution_source', { length: 120 })
      .notNull()
      .default(''),
    attributionMedium: varchar('attribution_medium', { length: 120 })
      .notNull()
      .default(''),
    attributionCampaign: varchar('attribution_campaign', { length: 120 })
      .notNull()
      .default(''),
    attributionContent: varchar('attribution_content', { length: 120 })
      .notNull()
      .default(''),
    attributionReferrer: text('attribution_referrer').notNull().default(''),
    attributionLandingPage: text('attribution_landing_page')
      .notNull()
      .default(''),
    attributionConfidence: varchar('attribution_confidence', { length: 40 })
      .notNull()
      .default(''),
    attributionSnapshot: longtext('attribution_snapshot'),
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
  ]
);

export const subscription = table(
  'subscription',
  {
    id: varchar191('id').primaryKey(),
    subscriptionNo: varchar191('subscription_no').unique().notNull(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    userEmail: varchar191('user_email'),
    status: varchar('status', { length: 50 }).notNull(),
    paymentProvider: varchar('payment_provider', { length: 50 }).notNull(),
    subscriptionId: varchar191('subscription_id').notNull(),
    subscriptionResult: text('subscription_result'),
    productId: varchar191('product_id'),
    description: text('description'),
    amount: int('amount'),
    currency: varchar('currency', { length: 10 }),
    interval: varchar('interval', { length: 50 }),
    intervalCount: int('interval_count'),
    trialPeriodDays: int('trial_period_days'),
    currentPeriodStart: timestamp('current_period_start'),
    currentPeriodEnd: timestamp('current_period_end'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    planName: varchar191('plan_name'),
    billingUrl: text('billing_url'),
    productName: varchar('product_name', { length: 255 }),
    creditsAmount: int('credits_amount'),
    creditsValidDays: int('credits_valid_days'),
    paymentProductId: varchar191('payment_product_id'),
    paymentUserId: varchar191('payment_user_id'),
    canceledAt: timestamp('canceled_at'),
    canceledEndAt: timestamp('canceled_end_at'),
    canceledReason: text('canceled_reason'),
    canceledReasonType: varchar('canceled_reason_type', { length: 50 }),
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
  ]
);

export const credit = table(
  'credit',
  {
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    userEmail: varchar191('user_email'),
    orderNo: varchar191('order_no'),
    subscriptionNo: varchar191('subscription_no'),
    transactionNo: varchar191('transaction_no').unique().notNull(),
    transactionType: varchar('transaction_type', { length: 50 }).notNull(),
    transactionScene: varchar('transaction_scene', { length: 50 }),
    credits: int('credits').notNull(),
    remainingCredits: int('remaining_credits').notNull().default(0),
    description: text('description'),
    expiresAt: timestamp('expires_at'),
    status: varchar('status', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    consumedDetail: text('consumed_detail'),
    metadata: text('metadata'),
    credentialCode: varchar191('credential_code'),
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
  ]
);

export const credential = table(
  'credential',
  {
    id: varchar191('id').primaryKey(),
    code: varchar191('code').unique().notNull(),
    ownerUserId: varchar191('owner_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    sourceOrderNo: varchar191('source_order_no'),
    planCode: varchar191('plan_code'),
    durationPreset: varchar('duration_preset', { length: 50 }),
    maxBindings: int('max_bindings').notNull().default(1),
    expiresAt: timestamp('expires_at'),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    partnerId: varchar191('partner_id'),
    variantId: varchar191('variant_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('idx_credential_owner_status').on(table.ownerUserId, table.status),
    index('idx_credential_source_order').on(table.sourceOrderNo),
    index('idx_credential_partner').on(table.partnerId, table.variantId),
  ]
);

export const credentialCredit = table(
  'credential_credit',
  {
    id: varchar191('id').primaryKey(),
    credentialId: varchar191('credential_id'),
    credentialCode: varchar191('credential_code').notNull(),
    userId: varchar191('user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    orderNo: varchar191('order_no'),
    totalCredits: int('total_credits').notNull().default(0),
    usedCredits: int('used_credits').notNull().default(0),
    expiresAt: timestamp('expires_at'),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    activatedAt: timestamp('activated_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('idx_credential_credit_code').on(table.credentialCode),
    index('idx_credential_credit_user_status').on(table.userId, table.status),
  ]
);

export const referralAccount = table(
  'referral_account',
  {
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    inviteCode: varchar191('invite_code').unique().notNull(),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    totalInvitees: int('total_invitees').notNull().default(0),
    totalCommission: int('total_commission').notNull().default(0),
    availableCommission: int('available_commission').notNull().default(0),
    pendingCommission: int('pending_commission').notNull().default(0),
    withdrawnCommission: int('withdrawn_commission').notNull().default(0),
    currency: varchar('currency', { length: 10 }).notNull().default('usd'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('idx_referral_account_user').on(table.userId),
    index('idx_referral_account_code').on(table.inviteCode),
  ]
);

export const referralRelation = table(
  'referral_relation',
  {
    id: varchar191('id').primaryKey(),
    referrerId: varchar191('referrer_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    refereeId: varchar191('referee_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    referralCode: varchar191('referral_code').notNull(),
    hasFirstOrder: boolean('has_first_order').notNull().default(false),
    firstOrderNo: varchar191('first_order_no'),
    firstOrderAt: timestamp('first_order_at'),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
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
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id'),
    relationId: varchar191('relation_id'),
    referrerUserId: varchar191('referrer_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    inviteeUserId: varchar191('invitee_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    orderNo: varchar191('order_no'),
    orderAmount: int('order_amount').notNull().default(0),
    orderCurrency: varchar('order_currency', { length: 10 })
      .notNull()
      .default('usd'),
    commissionRate: int('commission_rate').notNull().default(0),
    commissionAmount: int('commission_amount').notNull().default(0),
    commissionCurrency: varchar('commission_currency', { length: 10 })
      .notNull()
      .default('usd'),
    commissionType: varchar('commission_type', { length: 50 })
      .notNull()
      .default('first_order'),
    amount: int('amount').notNull().default(0),
    currency: varchar('currency', { length: 10 }).notNull().default('usd'),
    rate: int('rate').notNull().default(0),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
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
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    amount: int('amount').notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('usd'),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    accountInfo: text('account_info'),
    reviewerUserId: varchar191('reviewer_user_id'),
    reviewedAt: timestamp('reviewed_at'),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('idx_referral_withdrawal_user_status').on(table.userId, table.status),
    index('idx_referral_withdrawal_status').on(table.status),
  ]
);

export const referralRiskLog = table(
  'referral_risk_log',
  {
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    riskType: varchar('risk_type', { length: 80 }).notNull(),
    riskLevel: varchar('risk_level', { length: 50 }).notNull().default('low'),
    details: text('details'),
    action: varchar('action', { length: 50 }),
    resolvedAt: timestamp('resolved_at'),
    resolvedBy: varchar191('resolved_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_referral_risk_log_user').on(table.userId),
    index('idx_referral_risk_log_type').on(table.riskType, table.createdAt),
  ]
);

export const partner = table(
  'partner',
  {
    id: varchar191('id').primaryKey(),
    partnerCode: varchar191('partner_code').unique().notNull(),
    name: varchar191('name').notNull(),
    type: varchar('type', { length: 50 }).notNull().default('supplier'),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    ownerUserId: varchar191('owner_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    ownerEmail: varchar191('owner_email'),
    variantId: varchar191('variant_id'),
    contractStatus: varchar('contract_status', { length: 50 })
      .notNull()
      .default('draft'),
    seatLimit: int('seat_limit').notNull().default(0),
    usedSeats: int('used_seats').notNull().default(0),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
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
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    keyHash: varchar191('key_hash').notNull(),
    keyPrefix: varchar191('key_prefix').notNull(),
    title: varchar191('title').notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
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
    id: varchar191('id').primaryKey(),
    name: varchar191('name').notNull().unique(),
    title: varchar191('title').notNull(),
    description: text('description'),
    status: varchar('status', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    sort: int('sort').default(0).notNull(),
  },
  (table) => [index('idx_role_status').on(table.status)]
);

export const permission = table(
  'permission',
  {
    id: varchar191('id').primaryKey(),
    code: varchar191('code').notNull().unique(),
    resource: varchar('resource', { length: 50 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(),
    title: varchar191('title').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('idx_permission_resource_action').on(table.resource, table.action),
  ]
);

export const rolePermission = table(
  'role_permission',
  {
    id: varchar191('id').primaryKey(),
    roleId: varchar191('role_id')
      .notNull()
      .references(() => role.id, { onDelete: 'cascade' }),
    permissionId: varchar191('permission_id')
      .notNull()
      .references(() => permission.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
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
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    roleId: varchar191('role_id')
      .notNull()
      .references(() => role.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    expiresAt: timestamp('expires_at'),
  },
  (table) => [
    index('idx_user_role_user_expires').on(table.userId, table.expiresAt),
  ]
);

// ─── AI ──────────────────────────────────────────────────────────────────────

export const aiTask = table(
  'ai_task',
  {
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    mediaType: varchar('media_type', { length: 50 }).notNull(),
    provider: varchar('provider', { length: 50 }).notNull(),
    model: varchar191('model').notNull(),
    prompt: longtext('prompt').notNull(),
    options: longtext('options'),
    status: varchar('status', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    taskId: varchar191('task_id'),
    taskInfo: longtext('task_info'),
    taskResult: longtext('task_result'),
    costCredits: int('cost_credits').notNull().default(0),
    scene: varchar('scene', { length: 100 }).notNull().default(''),
    creditId: varchar191('credit_id'),
  },
  (table) => [
    index('idx_ai_task_user_media_type').on(table.userId, table.mediaType),
    index('idx_ai_task_media_type_status').on(table.mediaType, table.status),
  ]
);

export const chat = table(
  'chat',
  {
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    model: varchar191('model').notNull(),
    provider: varchar('provider', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull().default(''),
    parts: longtext('parts').notNull(),
    metadata: longtext('metadata'),
    content: longtext('content'),
  },
  (table) => [index('idx_chat_user_status').on(table.userId, table.status)]
);

export const chatMessage = table(
  'chat_message',
  {
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    chatId: varchar191('chat_id')
      .notNull()
      .references(() => chat.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    role: varchar('role', { length: 50 }).notNull(),
    parts: longtext('parts').notNull(),
    metadata: longtext('metadata'),
    model: varchar191('model').notNull(),
    provider: varchar('provider', { length: 50 }).notNull(),
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
    id: varchar191('id').primaryKey(),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id),
    title: varchar('title', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('open'), // open | replied | closed
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index('idx_ticket_user').on(t.userId),
    index('idx_ticket_status').on(t.status),
  ]
);

export const ticketMessage = table(
  'ticket_message',
  {
    id: varchar191('id').primaryKey(),
    ticketId: varchar191('ticket_id')
      .notNull()
      .references(() => ticket.id),
    userId: varchar191('user_id')
      .notNull()
      .references(() => user.id),
    role: varchar('role', { length: 50 }).notNull().default('user'), // user | admin
    content: longtext('content').notNull(),
    attachments: longtext('attachments').notNull(), // JSON array of image URLs (default [] set by service)
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('idx_ticket_message_ticket').on(t.ticketId)]
);

export type Ticket = typeof ticket.$inferSelect;
export type NewTicket = typeof ticket.$inferInsert;
export type TicketMessage = typeof ticketMessage.$inferSelect;
export type NewTicketMessage = typeof ticketMessage.$inferInsert;

// ─── Custom tables ───────────────────────────────────────────────────────────
// Add your own tables below this line.
