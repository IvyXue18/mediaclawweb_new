import { createFileRoute } from '@tanstack/react-router';
import { requireUser } from '@/routes/api/user/-compat';

import { normalizeChatProvider } from '@/modules/chat/provider';
import { ChatStatus, createChat } from '@/modules/chat/service';
import { getAllConfigs } from '@/modules/config/service';
import { getUuid } from '@/lib/hash';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  try {
    const { message, body } = await request.json();
    if (!message?.text) {
      throw new Error('message is required');
    }
    if (!body?.model) {
      throw new Error('please select a model');
    }

    const user = await requireUser(request);
    const configs = await getAllConfigs();
    const now = new Date();
    const provider =
      normalizeChatProvider(body.provider) ||
      normalizeChatProvider(configs.chat_ai_provider) ||
      normalizeChatProvider(configs.monitor_ai_provider) ||
      'openrouter';
    const title = String(message.text).substring(0, 100);

    const chat = await createChat({
      id: getUuid(),
      userId: user.id,
      status: ChatStatus.CREATED,
      createdAt: now,
      updatedAt: now,
      model: body.model,
      provider,
      title,
      parts: '',
      metadata: JSON.stringify(body),
      content: JSON.stringify(message),
    });

    return respData(chat);
  } catch (error: any) {
    console.log('new chat failed:', error);
    return respErr(`new chat failed: ${error.message || 'unknown error'}`);
  }
}

export const Route = createFileRoute('/api/chat/new')({
  server: { handlers: { POST } },
});
