import { createFileRoute } from '@tanstack/react-router';
import { hashPassword } from 'better-auth/crypto';
import { and, eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { account, user } from '@/config/db/schema';
import { getUuid } from '@/lib/hash';
import { respData, respErr } from '@/lib/resp';

import { requireAdmin } from '../../-compat';

export async function POST({
  params,
  request,
}: {
  params: { id: string };
  request: Request;
}) {
  try {
    await requireAdmin(request);

    const body = await request.json().catch(() => ({}));
    const newPassword =
      typeof body.newPassword === 'string' ? body.newPassword : '';
    const confirmPassword =
      typeof body.confirmPassword === 'string' ? body.confirmPassword : '';

    if (!newPassword || newPassword.length < 6) {
      return respErr('New password must be at least 6 characters');
    }
    if (newPassword !== confirmPassword) {
      return respErr('Passwords do not match');
    }

    const [targetUser] = await db()
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, params.id))
      .limit(1);

    if (!targetUser) return respErr('User not found');

    const hashed = await hashPassword(newPassword);
    const [credentialAccount] = await db()
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.userId, targetUser.id),
          eq(account.providerId, 'credential')
        )
      )
      .limit(1);

    if (credentialAccount) {
      await db()
        .update(account)
        .set({ password: hashed })
        .where(eq(account.id, credentialAccount.id));
    } else {
      await db().insert(account).values({
        id: getUuid(),
        accountId: targetUser.id,
        providerId: 'credential',
        userId: targetUser.id,
        password: hashed,
      });
    }

    return respData({ success: true });
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

export const Route = createFileRoute('/api/admin/users/$id/password')({
  server: { handlers: { POST } },
});
