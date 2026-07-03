import { createFileRoute } from '@tanstack/react-router';

import {
  freezeCredentialByIdForOwner,
  getCredentialById,
} from '@/modules/credentials/service';
import { respData, respErr } from '@/lib/resp';

import { requireUser } from '../-compat';

export async function GET({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    const user = await requireUser(request);
    const credential = await getCredentialById({
      id: params.id,
      ownerUserId: user.id,
    });

    if (!credential) return respErr('Credential not found');
    return respData(credential);
  } catch (error: any) {
    return respErr(error.message || 'Get credential failed');
  }
}

export async function POST({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    const user = await requireUser(request);
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || '').trim();

    if (action !== 'freeze') {
      return respErr('Unsupported action');
    }

    const credential = await freezeCredentialByIdForOwner({
      credentialId: params.id,
      ownerUserId: user.id,
    });

    if (!credential) return respErr('Credential not found');
    return respData(credential);
  } catch (error: any) {
    return respErr(error.message || 'Update credential failed');
  }
}

export const Route = createFileRoute('/api/user/credentials/$id')({
  server: {
    handlers: { GET, POST },
  },
});
