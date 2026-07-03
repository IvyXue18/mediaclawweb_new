import { createFileRoute } from '@tanstack/react-router';

import {
  claimCredentialForUser,
  getClaimReasonMessage,
} from '@/modules/credentials/service';
import { respData, respErr, respJson } from '@/lib/resp';

import { requireUser } from '../-compat';

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

export const Route = createFileRoute('/api/user/credentials/claim')({
  server: {
    handlers: { POST },
  },
});
