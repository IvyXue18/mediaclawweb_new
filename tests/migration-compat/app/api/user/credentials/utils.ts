import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/core/db';
import { credential, user } from '@/config/db/schema';

const DEFAULT_UNCLAIMED_OWNER_EMAIL =
  'system+unclaimed-credential@mediaclaw.local';

export type CredentialClaimReason =
  | 'claimable'
  | 'not_found'
  | 'invalid_status'
  | 'already_owned'
  | 'owned_by_other'
  | 'already_claimed'
  | 'invalid_code';

export type CredentialClaimStatusInternal = {
  exists: boolean;
  claimable: boolean;
  isUnclaimedOwner: boolean;
  reason: CredentialClaimReason;
  status: string | null;
  ownerUserId: string | null;
};

export type CredentialClaimResult =
  | {
      ok: true;
      data: {
        id: string;
        code: string;
        ownerUserId: string;
      };
    }
  | {
      ok: false;
      reason: CredentialClaimReason;
      status: CredentialClaimStatusInternal;
    };

function normalizeText(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getUnclaimedOwnerEmail() {
  return (
    normalizeText(process.env.CREDENTIAL_UNCLAIMED_OWNER_EMAIL) ||
    DEFAULT_UNCLAIMED_OWNER_EMAIL
  );
}

async function getCredentialByCode(code: string) {
  const rows = await db()
    .select({
      id: credential.id,
      code: credential.code,
      status: credential.status,
      ownerUserId: credential.ownerUserId,
      ownerEmail: user.email,
    })
    .from(credential)
    .leftJoin(user, eq(credential.ownerUserId, user.id))
    .where(and(eq(credential.code, code), isNull(credential.deletedAt)))
    .limit(1);

  return rows[0] || null;
}

export async function getCredentialClaimStatus({
  code,
  currentUserId,
}: {
  code: string;
  currentUserId: string;
}): Promise<CredentialClaimStatusInternal> {
  const normalizedCode = String(code || '').trim();
  if (!normalizedCode) {
    return {
      exists: false,
      claimable: false,
      isUnclaimedOwner: false,
      reason: 'invalid_code',
      status: null,
      ownerUserId: null,
    };
  }

  const row = await getCredentialByCode(normalizedCode);
  if (!row) {
    return {
      exists: false,
      claimable: false,
      isUnclaimedOwner: false,
      reason: 'not_found',
      status: null,
      ownerUserId: null,
    };
  }

  const isStatusActive = row.status === 'active';
  const isUnclaimedOwner =
    !row.ownerUserId ||
    normalizeText(row.ownerEmail) === getUnclaimedOwnerEmail();

  if (!isStatusActive) {
    return {
      exists: true,
      claimable: false,
      isUnclaimedOwner,
      reason: 'invalid_status',
      status: row.status,
      ownerUserId: row.ownerUserId || null,
    };
  }

  if (isUnclaimedOwner) {
    return {
      exists: true,
      claimable: true,
      isUnclaimedOwner: true,
      reason: 'claimable',
      status: row.status,
      ownerUserId: row.ownerUserId || null,
    };
  }

  if (row.ownerUserId === currentUserId) {
    return {
      exists: true,
      claimable: false,
      isUnclaimedOwner: false,
      reason: 'already_owned',
      status: row.status,
      ownerUserId: row.ownerUserId || null,
    };
  }

  return {
    exists: true,
    claimable: false,
    isUnclaimedOwner: false,
    reason: 'owned_by_other',
    status: row.status,
    ownerUserId: row.ownerUserId || null,
  };
}

export async function claimCredentialForUser({
  code,
  currentUserId,
}: {
  code: string;
  currentUserId: string;
}): Promise<CredentialClaimResult> {
  const status = await getCredentialClaimStatus({
    code,
    currentUserId,
  });

  if (!status.claimable) {
    return {
      ok: false,
      reason: status.reason,
      status,
    };
  }

  const normalizedCode = String(code || '').trim();
  const expectedOwnerCondition = status.ownerUserId
    ? eq(credential.ownerUserId, status.ownerUserId)
    : isNull(credential.ownerUserId);

  const updatedRows = await db()
    .update(credential)
    .set({
      ownerUserId: currentUserId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(credential.code, normalizedCode),
        eq(credential.status, 'active'),
        isNull(credential.deletedAt),
        expectedOwnerCondition
      )
    )
    .returning({
      id: credential.id,
      code: credential.code,
      ownerUserId: credential.ownerUserId,
    });

  if (updatedRows.length > 0) {
    return {
      ok: true,
      data: updatedRows[0],
    };
  }

  const latestStatus = await getCredentialClaimStatus({
    code: normalizedCode,
    currentUserId,
  });

  return {
    ok: false,
    reason: latestStatus.claimable ? 'already_claimed' : latestStatus.reason,
    status: latestStatus,
  };
}

export function getClaimReasonMessage(reason: CredentialClaimReason) {
  switch (reason) {
    case 'invalid_code':
      return 'credential code is required';
    case 'not_found':
      return 'activation code not found';
    case 'invalid_status':
      return 'activation code status is not claimable';
    case 'already_owned':
      return 'activation code already belongs to current account';
    case 'owned_by_other':
      return 'this activation code is already bound to another account';
    case 'already_claimed':
      return 'this activation code has been claimed by another account';
    default:
      return 'credential claim failed';
  }
}
