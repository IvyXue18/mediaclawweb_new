import { createFileRoute } from '@tanstack/react-router';

import { getCredentialByCode } from '@/modules/credentials/service';
import { respData, respErr } from '@/lib/resp';

import { requireUser } from './-compat';

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

    const credential = await getCredentialByCode(code);
    if (!credential) return respErr('Activation code not found');

    if (credential.status !== 'active') {
      return respErr(`credential is ${credential.status}`);
    }

    if (!credential.ownerUserId) {
      return respData({
        status: 'claimable',
        valid: true,
        code: credential.code,
      });
    }

    if (credential.ownerUserId !== user.id) {
      return respErr(
        'this activation code is already bound to another account'
      );
    }

    return respData({
      status: 'owned',
      valid: true,
      code: credential.code,
      credential,
    });
  } catch (error: any) {
    return respErr(error.message || 'Validate credential failed');
  }
}

export const Route = createFileRoute('/api/user/validate-credential')({
  server: {
    handlers: { POST },
  },
});
