import { createFileRoute } from '@tanstack/react-router';
import { requireUser } from '@/routes/api/user/-compat';

import { findChatById } from '@/modules/chat/service';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  try {
    const { chatId } = await request.json();
    if (!chatId) {
      return respErr('chatId is required');
    }

    const user = await requireUser(request);
    const chat = await findChatById(chatId);
    if (!chat) {
      return respErr('chat not found');
    }

    if (chat.userId !== user.id) {
      return respErr('no permission to access this chat');
    }

    return respData(chat);
  } catch (error: any) {
    console.log('get chat info failed:', error);
    return respErr(`get chat info failed: ${error.message || 'unknown error'}`);
  }
}

export const Route = createFileRoute('/api/chat/info')({
  server: { handlers: { POST } },
});
