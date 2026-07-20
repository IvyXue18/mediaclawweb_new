import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNull,
  like,
  or,
  type SQL,
} from 'drizzle-orm';

import { getAuth } from '@/core/auth';
import { db } from '@/core/db';
import { envConfigs } from '@/config';
import { credit } from '@/config/db/schema';
import { getConfig } from '@/modules/config/service';
import { listCredentials } from '@/modules/credentials/service';
import { getUserPlan } from '@/modules/invite-codes/service';
import { hasPermission } from '@/modules/rbac/service';
import { formatLoginIdentifier } from '@/lib/auth-identifier';
import { respData, respErr, respPage } from '@/lib/resp';

export async function requireUser(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error('Unauthorized');
  return session.user;
}

export function getPagination(request: Request, fallbackPageSize = 10) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('pageSize') || `${fallbackPageSize}`))
  );

  return { page, pageSize, searchParams };
}

export async function userCredentialsResponse(request: Request) {
  try {
    const user = await requireUser(request);
    const { page, pageSize, searchParams } = getPagination(request);
    const result = await listCredentials({
      page,
      pageSize,
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      ownerUserId: user.id,
    });
    return respPage(result.items, result.total);
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

export async function userCreditsResponse(request: Request) {
  try {
    const user = await requireUser(request);
    const { page, pageSize, searchParams } = getPagination(request, 20);
    const offset = (page - 1) * pageSize;
    const conditions: SQL[] = [
      eq(credit.userId, user.id),
      isNull(credit.deletedAt) as unknown as SQL,
    ];
    const transactionType = searchParams.get('transactionType');
    const credentialCode = searchParams.get('credentialCode')?.trim();
    const search = searchParams.get('search');

    if (transactionType === 'grant') {
      // Grants include activation-code issue and recharge rows.
      conditions.push(
        inArray(credit.transactionType, [
          'grant',
          'credential_issue',
          'credential_recharge',
        ])
      );
    } else if (transactionType === 'consume') {
      conditions.push(inArray(credit.transactionType, ['consume', 'expense']));
    } else if (transactionType) {
      conditions.push(eq(credit.transactionType, transactionType));
    }
    if (credentialCode) {
      conditions.push(eq(credit.credentialCode, credentialCode));
    }
    if (search) {
      conditions.push(
        or(
          like(credit.transactionNo, `%${search}%`),
          like(credit.description, `%${search}%`)
        )!
      );
    }

    const where = and(...conditions);
    const [totalResult] = await db()
      .select({ count: count() })
      .from(credit)
      .where(where);

    const rows = await db()
      .select({
        id: credit.id,
        transactionNo: credit.transactionNo,
        transactionType: credit.transactionType,
        transactionScene: credit.transactionScene,
        credits: credit.credits,
        remainingCredits: credit.remainingCredits,
        description: credit.description,
        status: credit.status,
        expiresAt: credit.expiresAt,
        createdAt: credit.createdAt,
        credentialCode: credit.credentialCode,
        metadata: credit.metadata,
      })
      .from(credit)
      .where(where)
      .orderBy(desc(credit.createdAt))
      .limit(pageSize)
      .offset(offset);

    return respPage(rows, totalResult.count);
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

export async function userInfoResponse(request: Request) {
  try {
    const user = await requireUser(request);
    const { plan, trialEndsAt } = await getUserPlan(user.id);
    const inviteRequired = (await getConfig('invite_code_required')) === 'true';
    const isAdmin = inviteRequired
      ? await hasPermission(user.id, 'admin.*')
      : false;
    const needsInvite = inviteRequired && plan === 'none' && !isAdmin;

    return respData({
      id: user.id,
      name: user.name,
      email: formatLoginIdentifier(user.email),
      image: user.image,
      plan,
      trialEndsAt: trialEndsAt?.toISOString() || null,
      authorized: plan === 'trial' || plan === 'member',
      needsInvite,
      appName: envConfigs.app_name,
    });
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}
