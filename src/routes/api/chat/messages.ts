import { createFileRoute } from '@tanstack/react-router';
import { requireUser } from '@/routes/api/user/-compat';

import {
  findChatById,
  getChatMessages,
  getChatMessagesCount,
} from '@/modules/chat/service';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { chatId } = body;
    if (!chatId) {
      return respErr('chatId is required');
    }

    const page = Math.max(1, Number(body.page || 1));
    const limit = Math.min(100, Math.max(1, Number(body.limit || 30)));

    const user = await requireUser(request);
    const chat = await findChatById(chatId);
    if (!chat) {
      return respErr('chat not found');
    }
    if (chat.userId !== user.id) {
      return respErr('no permission to access this chat');
    }

    const [list, total] = await Promise.all([
      getChatMessages({
        chatId,
        status: body.status,
        page,
        limit,
      }),
      getChatMessagesCount({
        chatId,
        status: body.status,
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
    console.log('get chat messages failed:', error);
    return respErr(
      `get chat messages failed: ${error.message || 'unknown error'}`
    );
  }
}

export const Route = createFileRoute('/api/chat/messages')({
  server: { handlers: { POST } },
});
