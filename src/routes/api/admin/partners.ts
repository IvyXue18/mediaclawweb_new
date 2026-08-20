import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  createPartner,
  listPartners,
  updatePartner,
} from '@/modules/partners/service';
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
      Math.max(1, parseInt(searchParams.get('pageSize') || '50'))
    );
    const result = await listPartners({
      page,
      pageSize,
      search: searchParams.get('search'),
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
    if (!body.name || typeof body.name !== 'string') {
      return respErr('Missing partner name');
    }
    const created = await createPartner({
      name: body.name,
      type: body.type,
      ownerEmail: body.ownerEmail,
      variantId: body.variantId,
      contractStatus: body.contractStatus,
      seatLimit: Number(body.seatLimit || 0),
      notes: body.notes,
    });
    return respData(created);
  } catch (error: any) {
    return respErr(error.message || 'Create partner failed');
  }
}

async function PATCH({ request }: { request: Request }) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    if (!body.id) return respErr('Missing id');
    const updated = await updatePartner({
      id: body.id,
      status: body.status,
      contractStatus: body.contractStatus,
      seatLimit:
        body.seatLimit === undefined ? undefined : Number(body.seatLimit),
      notes: body.notes,
    });
    if (!updated) return respErr('Partner not found');
    return respData(updated);
  } catch (error: any) {
    return respErr(error.message || 'Update partner failed');
  }
}

export const Route = createFileRoute('/api/admin/partners')({
  server: {
    handlers: { GET, POST, PATCH },
  },
});
