import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  claimCredentialForUser,
  getClaimReasonMessage,
  listCredentials,
} from '@/modules/credentials/service';
import { respData, respErr, respJson, respPage } from '@/lib/resp';

async function requireUser(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error('Unauthorized');
  return session.user;
}

export async function GET({ request }: { request: Request }) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') || '10'))
    );
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

export async function POST({ request }: { request: Request }) {
  try {
    const user = await requireUser(request);
    const body = await request.json().catch(() => ({}));
    const code =
      body.code ||
      body.credentialCode ||
      body.activationCode ||
      body.credential_code;
    if (!code || typeof code !== 'string') {
      return respErr('Missing activation code');
    }
    const result = await claimCredentialForUser({
      currentUserId: user.id,
      code,
    });
    if (!result.ok) {
      return respJson(-1, getClaimReasonMessage(result.reason), {
        reason: result.reason,
        status: result.status,
      });
    }
    return respData(result.data);
  } catch (error: any) {
    return respErr(error.message || 'Claim credential failed');
  }
}

export const Route = createFileRoute('/api/user/credentials')({
  server: {
    handlers: { GET, POST },
  },
});
