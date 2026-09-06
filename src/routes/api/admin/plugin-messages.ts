import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  createPluginMessage,
  listAdminPluginMessages,
  updatePluginMessage,
} from '@/modules/plugin-messages/service';
import { hasPermission } from '@/modules/rbac/service';
import { respData, respErr } from '@/lib/resp';

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
    return respData(await listAdminPluginMessages());
  } catch (error: any) {
    return respErr(error.message || 'List messages failed');
  }
}

async function POST({ request }: { request: Request }) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    return respData(await createPluginMessage(body, admin.id));
  } catch (error: any) {
    return respErr(error.message || 'Create message failed');
  }
}

async function PATCH({ request }: { request: Request }) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    if (!body.id) return respErr('Missing id');
    const updated = await updatePluginMessage(body.id, body);
    return updated ? respData(updated) : respErr('Message not found');
  } catch (error: any) {
    return respErr(error.message || 'Update message failed');
  }
}

export const Route = createFileRoute('/api/admin/plugin-messages')({
  server: { handlers: { GET, POST, PATCH } },
});
