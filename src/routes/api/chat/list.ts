import { createFileRoute } from '@tanstack/react-router';
import { requireUser } from '@/routes/api/user/-compat';

import { ChatStatus, getChats, getChatsCount } from '@/modules/chat/service';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const page = Math.max(1, Number(body.page || 1));
    const limit = Math.min(100, Math.max(1, Number(body.limit || 30)));

    const user = await requireUser(request);
    const [list, total] = await Promise.all([
      getChats({
        userId: user.id,
        status: ChatStatus.CREATED,
        page,
        limit,
      }),
      getChatsCount({
        userId: user.id,
        status: ChatStatus.CREATED,
      }),
    ]);

    return respData({
      list,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    });
  } catch (error: any) {
    console.log('get chat list failed:', error);
    return respErr(`get chat list failed: ${error.message || 'unknown error'}`);
  }
}

export const Route = createFileRoute('/api/chat/list')({
  server: { handlers: { POST } },
});
