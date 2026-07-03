import { createFileRoute } from '@tanstack/react-router';

import {
  getCredentialClaimStatus,
  listCredentials,
} from '@/modules/credentials/service';
import { respData, respErr } from '@/lib/resp';

import { requireUser } from '../-compat';

export async function GET({ request }: { request: Request }) {
  try {
    const user = await requireUser(request);
    const result = await listCredentials({
      page: 1,
      pageSize: 100,
      ownerUserId: user.id,
      status: null,
      search: null,
    });

    return respData({
      claimed: result.total > 0,
      credentials: result.items,
      total: result.total,
    });
  } catch (error: any) {
    return respErr(error.message || 'Get claim status failed');
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
      return respErr('credential code is required');
    }

    const status = await getCredentialClaimStatus({
      code,
      currentUserId: user.id,
    });

    return respData(status);
  } catch (error: any) {
    return respErr(error.message || 'Get credential claim status failed');
  }
}

export const Route = createFileRoute('/api/user/credentials/claim-status')({
  server: {
    handlers: { GET, POST },
  },
});
