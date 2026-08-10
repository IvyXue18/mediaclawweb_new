import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  createCredential,
  listCredentials,
  updateCredentialStatus,
  type CredentialStatus,
} from '@/modules/credentials/service';
import { hasPermission } from '@/modules/rbac/service';
import { respData, respErr, respPage } from '@/lib/resp';

async function requireAdmin(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error('Unauthorized');
  const isAdmin = await hasPermission(session.user.id, 'admin.*');
  if (!isAdmin) throw new Error('Forbidden');
  return session.user;
}

async function GET({ request }: { request: Request }) {
  try {
    await requireAdmin(request);
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
      searchOwner: true,
      status: searchParams.get('status'),
    });
    return respPage(result.items, result.total);
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

async function POST({ request }: { request: Request }) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    const created = await createCredential({
      code: body.code,
      ownerEmail: body.ownerEmail,
      sourceOrderNo: body.sourceOrderNo,
      planCode: body.planCode,
      durationPreset: body.durationPreset,
      maxBindings: Number(body.maxBindings || 1),
      expiresAt,
      partnerId: body.partnerId,
      variantId: body.variantId,
      notes: body.notes,
      totalCredits: Number(body.totalCredits || 0),
    });
    return respData(created);
  } catch (error: any) {
    return respErr(error.message || 'Create credential failed');
  }
}

async function PATCH({ request }: { request: Request }) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    if (!body.id) return respErr('Missing id');
    if (!body.status) return respErr('Missing status');
    const updated = await updateCredentialStatus({
      id: body.id,
      status: body.status as CredentialStatus,
      notes: body.notes,
    });
    if (!updated) return respErr('Credential not found');
    return respData(updated);
  } catch (error: any) {
    return respErr(error.message || 'Update credential failed');
  }
}

export const Route = createFileRoute('/api/admin/credentials')({
  server: {
    handlers: { GET, POST, PATCH },
  },
});
