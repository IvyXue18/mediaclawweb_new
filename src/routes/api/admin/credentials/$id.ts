import { createFileRoute } from '@tanstack/react-router';

import {
  getCredentialById,
  rechargeCredential,
  updateCredentialStatus,
  type CredentialStatus,
} from '@/modules/credentials/service';
import { respData, respErr } from '@/lib/resp';

import { requireAdmin } from '../-compat';

async function GET({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    await requireAdmin(request);
    const credential = await getCredentialById({ id: params.id });
    if (!credential) return respErr('Credential not found');
    return respData(credential);
  } catch (error: any) {
    return respErr(error.message || 'Get credential failed');
  }
}

async function PATCH({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    const status = body.status as CredentialStatus | undefined;
    if (!status) return respErr('Missing status');

    const updated = await updateCredentialStatus({
      id: params.id,
      status,
      notes: body.notes,
    });
    if (!updated) return respErr('Credential not found');
    return respData(updated);
  } catch (error: any) {
    return respErr(error.message || 'Update credential failed');
  }
}

async function POST({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    const updated = await rechargeCredential({
      id: params.id,
      credits: Number(body.credits || 0),
      durationDays: Number(body.durationDays || body.duration_days || 0),
      expiresAt,
      maxBindings:
        body.maxBindings === undefined && body.max_bindings === undefined
          ? undefined
          : Number(body.maxBindings ?? body.max_bindings),
      notes: body.notes,
    });
    return respData(updated);
  } catch (error: any) {
    return respErr(error.message || 'Recharge credential failed');
  }
}

export const Route = createFileRoute('/api/admin/credentials/$id')({
  server: {
    handlers: { GET, PATCH, POST },
  },
});
