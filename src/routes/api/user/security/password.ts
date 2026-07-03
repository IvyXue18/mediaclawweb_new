import { createFileRoute } from '@tanstack/react-router';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { and, eq } from 'drizzle-orm';

import { getAuth } from '@/core/auth';
import { db } from '@/core/db';
import { account } from '@/config/db/schema';
import { respData, respErr } from '@/lib/resp';

export async function POST({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const body = await request.json().catch(() => ({}));
    const password = typeof body.password === 'string' ? body.password : '';
    const newPassword =
      typeof body.newPassword === 'string' ? body.newPassword : '';
    const confirmPassword =
      typeof body.confirmPassword === 'string' ? body.confirmPassword : '';

    if (!password.trim()) {
      return respErr('Current password is required');
    }
    if (!newPassword || newPassword.length < 6) {
      return respErr('New password must be at least 6 characters');
    }
    if (newPassword !== confirmPassword) {
      return respErr('Passwords do not match');
    }

    const [credentialAccount] = await db()
      .select({ id: account.id, password: account.password })
      .from(account)
      .where(
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, 'credential')
        )
      )
      .limit(1);

    if (!credentialAccount?.password) {
      return respErr('No password account found');
    }

    const isValid = await verifyPassword({
      hash: credentialAccount.password,
      password,
    });
    if (!isValid) {
      return respErr('Current password is incorrect');
    }

    const hashed = await hashPassword(newPassword);
    await db()
      .update(account)
      .set({ password: hashed })
      .where(eq(account.id, credentialAccount.id));

    return respData({ success: true });
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

export const Route = createFileRoute('/api/user/security/password')({
  server: { handlers: { POST } },
});
