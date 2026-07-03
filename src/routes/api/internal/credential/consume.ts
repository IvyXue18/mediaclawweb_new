import { createFileRoute } from '@tanstack/react-router';
import { and, eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { envConfigs } from '@/config';
import { credential, credentialCredit, credit, user } from '@/config/db/schema';
import { CreditStatus, CreditTransactionType } from '@/modules/credits/service';
import { getSnowId, getUuid } from '@/lib/hash';

type ConsumeRequest = {
  credential_code?: string;
  credits?: number;
  scene?: string;
  description?: string;
  metadata?: Record<string, any> | null;
  biz_no?: string;
};

function json(body: unknown, init?: ResponseInit) {
  return Response.json(body, init);
}

function buildConsumeTransactionNo(userId: string, bizNo?: string): string {
  const normalizedBizNo = String(bizNo || '').trim();
  if (!normalizedBizNo) {
    return getSnowId();
  }

  return `credential_consume:${userId}:${normalizedBizNo}`;
}

export async function POST({ request }: { request: Request }) {
  try {
    const token = request.headers.get('x-internal-token') || '';
    const expectedToken =
      envConfigs.license_internal_token || envConfigs.auth_secret;

    if (!expectedToken || token !== expectedToken) {
      return json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as ConsumeRequest;
    const credentialCode = String(body.credential_code || '').trim();
    const credits = Number(body.credits || 0);
    const scene = String(body.scene || 'account_monitor').trim();
    const description = String(
      body.description || 'credential credit consume'
    ).trim();
    const bizNo = String(body.biz_no || '').trim();
    const metadata =
      body.metadata && typeof body.metadata === 'object' ? body.metadata : null;

    if (!credentialCode) {
      return json(
        { ok: false, message: 'credential_code is required' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(credits) || credits <= 0) {
      return json(
        { ok: false, message: 'credits must be a positive number' },
        { status: 400 }
      );
    }

    const result = await db().transaction(async (tx: any) => {
      const [summary] = await tx
        .select()
        .from(credentialCredit)
        .where(eq(credentialCredit.credentialCode, credentialCode))
        .limit(1)
        .for('update');

      if (!summary) {
        throw new Error('credential not found');
      }

      if (!summary.userId) {
        throw new Error('credential has no owner user');
      }

      if (summary.status !== 'active') {
        throw new Error(`credential credit is ${summary.status}`);
      }

      const [parentCredential] = await tx
        .select({
          ownerUserId: credential.ownerUserId,
          status: credential.status,
          deletedAt: credential.deletedAt,
        })
        .from(credential)
        .where(eq(credential.code, credentialCode))
        .limit(1);

      if (!parentCredential || parentCredential.deletedAt) {
        throw new Error('credential not found');
      }

      if (parentCredential.status !== 'active') {
        throw new Error(`credential is ${parentCredential.status}`);
      }

      if (
        parentCredential.ownerUserId &&
        parentCredential.ownerUserId !== summary.userId
      ) {
        throw new Error('credential owner mismatch');
      }

      const transactionNo = buildConsumeTransactionNo(summary.userId, bizNo);

      if (bizNo) {
        const [existed] = await tx
          .select({
            transactionNo: credit.transactionNo,
            createdAt: credit.createdAt,
            credits: credit.credits,
          })
          .from(credit)
          .where(
            and(
              eq(credit.transactionNo, transactionNo),
              eq(credit.transactionType, CreditTransactionType.CONSUME),
              eq(credit.userId, summary.userId),
              eq(credit.credentialCode, credentialCode)
            )
          )
          .limit(1);

        if (existed) {
          return {
            transactionNo: existed.transactionNo,
            createdAt: existed.createdAt,
            credentialCode,
            consumedCredits: Math.abs(Number(existed.credits || 0)),
            remainingCredits:
              Number(summary.totalCredits || 0) -
              Number(summary.usedCredits || 0),
          };
        }
      }

      const totalCredits = Number(summary.totalCredits || 0);
      const usedCredits = Number(summary.usedCredits || 0);
      const remainingBefore = totalCredits - usedCredits;
      if (remainingBefore < credits) {
        throw new Error(
          `insufficient credential credits: ${remainingBefore} < ${credits}`
        );
      }

      const newUsedCredits = usedCredits + credits;
      const remainingAfter = totalCredits - newUsedCredits;
      const now = new Date();
      const nextStatus = remainingAfter <= 0 ? 'exhausted' : 'active';

      await tx
        .update(credentialCredit)
        .set({
          usedCredits: newUsedCredits,
          status: nextStatus,
          activatedAt: summary.activatedAt || now,
          updatedAt: now,
        })
        .where(eq(credentialCredit.id, summary.id));

      const [owner] = await tx
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, summary.userId))
        .limit(1);

      const [consumedCredit] = await tx
        .insert(credit)
        .values({
          id: getUuid(),
          userId: summary.userId,
          userEmail: owner?.email || null,
          orderNo: summary.orderNo || null,
          transactionNo,
          transactionType: CreditTransactionType.CONSUME,
          transactionScene: scene,
          credits: -credits,
          remainingCredits: 0,
          description,
          status: CreditStatus.ACTIVE,
          credentialCode,
          metadata: JSON.stringify({
            source: 'credential_consume',
            bizNo: bizNo || null,
            remainingBefore,
            remainingAfter,
            credentialCreditId: summary.id,
            ...(metadata || {}),
          }),
        })
        .returning({
          transactionNo: credit.transactionNo,
          createdAt: credit.createdAt,
        });

      return {
        transactionNo: consumedCredit.transactionNo,
        createdAt: consumedCredit.createdAt,
        credentialCode,
        consumedCredits: credits,
        remainingCredits: remainingAfter,
      };
    });

    return json({ ok: true, data: result });
  } catch (error: any) {
    return json(
      { ok: false, message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const Route = createFileRoute('/api/internal/credential/consume')({
  server: {
    handlers: { POST },
  },
});
