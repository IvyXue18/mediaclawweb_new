/**
 * Import one activation code and its credit ledger from the legacy PostgreSQL
 * service into the current database.
 *
 * Required environment:
 *   LEGACY_DATABASE_URL=postgres://...
 *   DATABASE_URL=file:data/local.db
 *
 * Usage:
 *   pnpm tsx scripts/import-legacy-credential.ts \
 *     --code=ACT-XXXX-XXXX --email=user@example.com [--dry-run]
 */

import { createClient, type InStatement } from '@libsql/client';
import postgres from 'postgres';

type LegacyCredential = {
  id: string;
  code: string;
  ownerEmail: string;
  sourceOrderNo: string | null;
  partnerId: string | null;
  variantId: string | null;
  planCode: string | null;
  durationPreset: string | null;
  status: string;
  expiresAt: Date | null;
  maxBindings: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type LegacyCreditSummary = {
  id: string;
  credentialId: string | null;
  credentialCode: string;
  orderNo: string | null;
  totalCredits: number;
  usedCredits: number;
  expiresAt: Date | null;
  status: string;
  activatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type LegacyCreditRow = {
  id: string;
  userEmail: string | null;
  orderNo: string | null;
  subscriptionNo: string | null;
  transactionNo: string;
  transactionType: string;
  transactionScene: string | null;
  credits: number;
  remainingCredits: number;
  description: string | null;
  expiresAt: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  consumedDetail: string | null;
  metadata: string | null;
  credentialCode: string | null;
};

function readArg(name: string): string {
  const prefix = `--${name}=`;
  return (
    process.argv
      .find((item) => item.startsWith(prefix))
      ?.slice(prefix.length) || ''
  ).trim();
}

function toMillis(value: Date | string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const millis =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(millis)) throw new Error(`Invalid timestamp: ${value}`);
  return millis;
}

const code = readArg('code').toUpperCase();
const email = readArg('email').toLowerCase();
const dryRun = process.argv.includes('--dry-run');
const legacyDatabaseUrl = process.env.LEGACY_DATABASE_URL || '';
const targetDatabaseUrl = process.env.DATABASE_URL || 'file:data/local.db';

if (!code || !email) {
  throw new Error('--code and --email are required');
}
if (!legacyDatabaseUrl) {
  throw new Error('LEGACY_DATABASE_URL is required');
}
if (!targetDatabaseUrl.startsWith('file:')) {
  throw new Error('This importer currently requires a file: SQLite target');
}

const legacy = postgres(legacyDatabaseUrl, {
  prepare: false,
  max: 1,
  idle_timeout: 10,
});
const target = createClient({ url: targetDatabaseUrl });

try {
  const credentialRows = await legacy<LegacyCredential[]>`
    select
      c.id,
      c.code,
      u.email as "ownerEmail",
      c.source_order_no as "sourceOrderNo",
      c.partner_id as "partnerId",
      c.variant_id as "variantId",
      c.plan_code as "planCode",
      c.duration_preset as "durationPreset",
      c.status,
      c.expires_at as "expiresAt",
      c.max_bindings as "maxBindings",
      c.notes,
      c.created_at as "createdAt",
      c.updated_at as "updatedAt"
    from credential c
    join "user" u on u.id = c.owner_user_id
    where upper(c.code) = ${code}
    limit 2
  `;
  if (credentialRows.length !== 1) {
    throw new Error(
      credentialRows.length === 0
        ? `Legacy credential not found: ${code}`
        : `Legacy credential is not unique: ${code}`
    );
  }

  const credential = credentialRows[0];
  if (credential.ownerEmail.toLowerCase() !== email) {
    throw new Error(
      `Owner mismatch: ${code} belongs to ${credential.ownerEmail}, not ${email}`
    );
  }

  const summaries = await legacy<LegacyCreditSummary[]>`
    select
      id,
      credential_id as "credentialId",
      credential_code as "credentialCode",
      order_no as "orderNo",
      total_credits as "totalCredits",
      used_credits as "usedCredits",
      expires_at as "expiresAt",
      status,
      activated_at as "activatedAt",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from credential_credit
    where upper(credential_code) = ${code}
    order by created_at
  `;
  if (summaries.length !== 1) {
    throw new Error(
      `Expected one legacy credit summary for ${code}, found ${summaries.length}`
    );
  }

  const ledger = await legacy<LegacyCreditRow[]>`
    select
      id,
      user_email as "userEmail",
      order_no as "orderNo",
      subscription_no as "subscriptionNo",
      transaction_no as "transactionNo",
      transaction_type as "transactionType",
      transaction_scene as "transactionScene",
      credits,
      remaining_credits as "remainingCredits",
      description,
      expires_at as "expiresAt",
      status,
      created_at as "createdAt",
      updated_at as "updatedAt",
      deleted_at as "deletedAt",
      consumed_detail as "consumedDetail",
      metadata,
      credential_code as "credentialCode"
    from credit
    where upper(credential_code) = ${code}
    order by created_at, id
  `;

  const targetUsers = await target.execute({
    sql: 'select id, email from user where lower(email) = lower(?) limit 2',
    args: [email],
  });
  if (targetUsers.rows.length !== 1) {
    throw new Error(
      `Expected one target user for ${email}, found ${targetUsers.rows.length}`
    );
  }
  const targetUserId = String(targetUsers.rows[0].id);

  const existingCredentials = await target.execute({
    sql: 'select id, owner_user_id from credential where upper(code) = upper(?) limit 2',
    args: [code],
  });
  if (
    existingCredentials.rows.length > 0 &&
    String(existingCredentials.rows[0].owner_user_id || '') !== targetUserId
  ) {
    throw new Error(`Target credential ${code} belongs to another user`);
  }
  const targetCredentialId = existingCredentials.rows.length
    ? String(existingCredentials.rows[0].id)
    : credential.id;

  const existingSummaries = await target.execute({
    sql: 'select id, user_id from credential_credit where upper(credential_code) = upper(?) order by created_at limit 2',
    args: [code],
  });
  if (
    existingSummaries.rows.some(
      (row) => row.user_id && String(row.user_id) !== targetUserId
    )
  ) {
    throw new Error(
      `Target credit summary for ${code} belongs to another user`
    );
  }
  if (existingSummaries.rows.length > 1) {
    throw new Error(`Target has duplicate credit summaries for ${code}`);
  }

  for (let offset = 0; offset < ledger.length; offset += 400) {
    const transactionNos = ledger
      .slice(offset, offset + 400)
      .map((row) => row.transactionNo);
    const conflicts = await target.execute({
      sql: `select transaction_no, user_id, credential_code
        from credit
        where transaction_no in (${transactionNos.map(() => '?').join(', ')})
          and (user_id <> ? or coalesce(credential_code, '') <> ?)`,
      args: [...transactionNos, targetUserId, code],
    });
    if (conflicts.rows.length > 0) {
      throw new Error(
        `Target ledger transaction belongs to another user or credential: ${String(conflicts.rows[0].transaction_no)}`
      );
    }
  }

  const summary = summaries[0];
  const targetSummaryId = existingSummaries.rows.length
    ? String(existingSummaries.rows[0].id)
    : summary.id;

  // The legacy model aggregates all top-ups into one summary. If an expired
  // summary later received a permanent recharge, its current remaining pool is
  // permanent even though the stale aggregate expiry was never cleared.
  const hasPermanentRecharge = ledger.some(
    (row) =>
      !row.deletedAt &&
      !row.expiresAt &&
      Number(row.credits) > 0 &&
      ['income', 'credential_recharge'].includes(row.transactionType)
  );
  const summaryExpiresAt = hasPermanentRecharge ? null : summary.expiresAt;

  console.log(
    JSON.stringify(
      {
        dryRun,
        code,
        email,
        targetUserId,
        ledgerRows: ledger.length,
        totalCredits: Number(summary.totalCredits),
        usedCredits: Number(summary.usedCredits),
        remainingCredits:
          Number(summary.totalCredits) - Number(summary.usedCredits),
        credentialExpiresAt: credential.expiresAt,
        creditExpiresAt: summaryExpiresAt,
      },
      null,
      2
    )
  );

  if (!dryRun) {
    const statements: InStatement[] = [
      {
        sql: `insert into credential (
        id, code, owner_user_id, source_order_no, plan_code, duration_preset,
        max_bindings, expires_at, status, partner_id, variant_id, notes,
        created_at, updated_at, deleted_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null)
      on conflict(code) do update set
        owner_user_id = excluded.owner_user_id,
        source_order_no = excluded.source_order_no,
        plan_code = excluded.plan_code,
        duration_preset = excluded.duration_preset,
        max_bindings = excluded.max_bindings,
        expires_at = excluded.expires_at,
        status = excluded.status,
        partner_id = excluded.partner_id,
        variant_id = excluded.variant_id,
        notes = excluded.notes,
        updated_at = excluded.updated_at,
        deleted_at = null`,
        args: [
          targetCredentialId,
          credential.code,
          targetUserId,
          credential.sourceOrderNo,
          credential.planCode,
          credential.durationPreset,
          Number(credential.maxBindings),
          toMillis(credential.expiresAt),
          credential.status,
          credential.partnerId,
          credential.variantId,
          credential.notes,
          toMillis(credential.createdAt),
          toMillis(credential.updatedAt),
        ],
      },
      {
        sql: `insert into credential_credit (
        id, credential_id, credential_code, user_id, order_no, total_credits,
        used_credits, expires_at, status, activated_at, created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(id) do update set
        credential_id = excluded.credential_id,
        credential_code = excluded.credential_code,
        user_id = excluded.user_id,
        order_no = excluded.order_no,
        total_credits = excluded.total_credits,
        used_credits = excluded.used_credits,
        expires_at = excluded.expires_at,
        status = excluded.status,
        activated_at = excluded.activated_at,
        updated_at = excluded.updated_at`,
        args: [
          targetSummaryId,
          targetCredentialId,
          code,
          targetUserId,
          summary.orderNo,
          Number(summary.totalCredits),
          Number(summary.usedCredits),
          toMillis(summaryExpiresAt),
          summary.status,
          toMillis(summary.activatedAt),
          toMillis(summary.createdAt),
          toMillis(summary.updatedAt),
        ],
      },
      ...ledger.map<InStatement>((row) => ({
        sql: `insert into credit (
        id, user_id, user_email, order_no, subscription_no, transaction_no,
        transaction_type, transaction_scene, credits, remaining_credits,
        description, expires_at, status, created_at, updated_at, deleted_at,
        consumed_detail, metadata, credential_code
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(transaction_no) do update set
        user_id = excluded.user_id,
        user_email = excluded.user_email,
        order_no = excluded.order_no,
        subscription_no = excluded.subscription_no,
        transaction_type = excluded.transaction_type,
        transaction_scene = excluded.transaction_scene,
        credits = excluded.credits,
        remaining_credits = excluded.remaining_credits,
        description = excluded.description,
        expires_at = excluded.expires_at,
        status = excluded.status,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at,
        consumed_detail = excluded.consumed_detail,
        metadata = excluded.metadata,
        credential_code = excluded.credential_code`,
        args: [
          row.id,
          targetUserId,
          email,
          row.orderNo,
          row.subscriptionNo,
          row.transactionNo,
          row.transactionType,
          row.transactionScene,
          Number(row.credits),
          Number(row.remainingCredits),
          row.description,
          toMillis(row.expiresAt),
          row.status,
          toMillis(row.createdAt),
          toMillis(row.updatedAt),
          toMillis(row.deletedAt),
          row.consumedDetail,
          row.metadata,
          code,
        ],
      })),
    ];

    await target.batch(statements, 'write');

    const verification = await target.execute({
      sql: `select
        (select count(*) from credential where code = ?) as credentials,
        (select count(*) from credential_credit where credential_code = ? and user_id = ?) as summaries,
        (select count(*) from credit where credential_code = ? and user_id = ?) as ledger_rows`,
      args: [code, code, targetUserId, code, targetUserId],
    });
    console.log(JSON.stringify(verification.rows[0], null, 2));
  }
} finally {
  target.close();
  await legacy.end({ timeout: 5 });
}
