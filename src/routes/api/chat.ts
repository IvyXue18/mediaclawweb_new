import { createFileRoute } from '@tanstack/react-router';
import { requireUser } from '@/routes/api/user/-compat';

import { requestChatCompletionWithFallback } from '@/modules/chat/provider';
import {
  ChatMessageStatus,
  createChatMessage,
  findChatById,
  getChatMessages,
} from '@/modules/chat/service';
import { getAllConfigs } from '@/modules/config/service';
import { getUuid } from '@/lib/hash';
import { respData, respErr } from '@/lib/resp';

type MessagePart = {
  type?: string;
  text?: string;
};

function extractTextFromParts(parts: MessagePart[] | undefined) {
  return (parts || [])
    .filter((part) => !part.type || part.type === 'text')
    .map((part) => part.text || '')
    .join('\n')
    .trim();
}

function toOpenRouterMessage(message: { role: string; parts?: string }) {
  let parts: MessagePart[] = [];
  try {
    parts = message.parts ? JSON.parse(message.parts) : [];
  } catch {
    parts = [];
  }

  return {
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: extractTextFromParts(parts),
  };
}

function getAssistantTextFromPayload(payload: any) {
  const content =
    payload?.choices?.[0]?.delta?.content ||
    payload?.choices?.[0]?.message?.content ||
    payload?.choices?.[0]?.text ||
    '';

  return typeof content === 'string' ? content : '';
}

function getAssistantTextFromSseLine(line: string) {
  if (!line.startsWith('data:')) {
    return '';
  }

  const payload = line.slice(5).trim();
  if (!payload || payload === '[DONE]') {
    return '';
  }

  try {
    return getAssistantTextFromPayload(JSON.parse(payload));
  } catch {
    return '';
  }
}

function getAssistantTextFromSseChunk(chunk: string) {
  return chunk.split(/\r?\n/).map(getAssistantTextFromSseLine).join('');
}

function sseError(message: string) {
  return new Response(
    `event: error\ndata: ${JSON.stringify({ message })}\n\n`,
    {
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream; charset=utf-8',
      },
      status: 500,
    }
  );
}

export async function POST({ request }: { request: Request }) {
  let wantsStream = false;

  try {
    const {
      chatId,
      message,
      model,
      webSearch,
      reasoning,
      stream,
    }: {
      chatId: string;
      message: { parts?: MessagePart[] };
      model: string;
      webSearch?: boolean;
      reasoning?: boolean;
      stream?: boolean;
    } = await request.json();
    wantsStream = Boolean(stream);

    if (!chatId || !model) {
      throw new Error('invalid params');
    }

    if (!message?.parts?.length) {
      throw new Error('invalid message');
    }

    const user = await requireUser(request);
    const chat = await findChatById(chatId);
    if (!chat) {
      throw new Error('chat not found');
    }
    if (chat.userId !== user.id) {
      throw new Error('no permission to access this chat');
    }

    const configs = await getAllConfigs();
    const now = new Date();
    const preferredProvider =
      chat.provider || configs.chat_ai_provider || configs.monitor_ai_provider;
    const metadata = {
      model,
      requestedProvider: preferredProvider || 'openrouter',
      webSearch: Boolean(webSearch),
      reasoning,
    };

    await createChatMessage({
      id: getUuid(),
      chatId,
      userId: user.id,
      status: ChatMessageStatus.CREATED,
      createdAt: now,
      updatedAt: now,
      role: 'user',
      parts: JSON.stringify(message.parts),
      metadata: JSON.stringify(metadata),
      model,
      provider: preferredProvider || 'openrouter',
    });

    const previousMessages = await getChatMessages({
      chatId,
      status: ChatMessageStatus.CREATED,
      page: 1,
      limit: 20,
    });

    const messages = previousMessages
      .map(toOpenRouterMessage)
      .filter((item) => item.content);

    const chatRequest = await requestChatCompletionWithFallback({
      configs,
      preferredProvider,
      model,
      messages,
      stream: wantsStream,
    });
    const response = chatRequest.response;

    if (wantsStream) {
      if (!response.body) {
        throw new Error(`${chatRequest.provider} stream is empty`);
      }

      const reader = response.body.getReader();
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const assistantId = getUuid();
      let assistantText = '';
      let buffer = '';

      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(
              encoder.encode(
                `event: meta\ndata: ${JSON.stringify({
                  type: 'chat_provider_meta',
                  provider: chatRequest.provider,
                  model: chatRequest.model,
                  requestedModel: model,
                  requestedProvider: preferredProvider || 'openrouter',
                  attempts: chatRequest.attempts,
                })}\n\n`
              )
            );

            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              controller.enqueue(encoder.encode(chunk));

              buffer += chunk;
              const lines = buffer.split(/\r?\n/);
              buffer = lines.pop() || '';
              assistantText += getAssistantTextFromSseChunk(lines.join('\n'));
            }

            if (buffer) {
              assistantText += getAssistantTextFromSseChunk(buffer);
            }

            if (assistantText.trim()) {
              await createChatMessage({
                id: assistantId,
                chatId,
                userId: user.id,
                status: ChatMessageStatus.CREATED,
                createdAt: new Date(),
                updatedAt: new Date(),
                role: 'assistant',
                parts: JSON.stringify([{ type: 'text', text: assistantText }]),
                model: chatRequest.model,
                provider: chatRequest.provider,
                metadata: JSON.stringify({
                  requestedModel: model,
                  requestedProvider: preferredProvider || 'openrouter',
                  attempts: chatRequest.attempts,
                }),
              });
            }

            controller.close();
          } catch (error: any) {
            controller.enqueue(
              encoder.encode(
                `event: error\ndata: ${JSON.stringify({
                  message: error?.message || 'chat failed',
                })}\n\n`
              )
            );
            controller.close();
          } finally {
            reader.releaseLock();
          }
        },
      });

      return new Response(streamResponse, {
        headers: {
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'Content-Type': 'text/event-stream; charset=utf-8',
        },
      });
    }

    const data = await response.json().catch(() => ({}));
    const text = getAssistantTextFromPayload(data);
    const assistantParts = [{ type: 'text', text }];
    const assistantId = getUuid();

    await createChatMessage({
      id: assistantId,
      chatId,
      userId: user.id,
      status: ChatMessageStatus.CREATED,
      createdAt: now,
      updatedAt: now,
      role: 'assistant',
      parts: JSON.stringify(assistantParts),
      model: chatRequest.model,
      provider: chatRequest.provider,
      metadata: JSON.stringify({
        requestedModel: model,
        requestedProvider: preferredProvider || 'openrouter',
        attempts: chatRequest.attempts,
      }),
    });

    return respData({
      id: assistantId,
      role: 'assistant',
      parts: assistantParts,
      metadata: {
        model: chatRequest.model,
        provider: chatRequest.provider,
        attempts: chatRequest.attempts,
        usage: data?.usage,
        finishReason: data?.choices?.[0]?.finish_reason,
      },
    });
  } catch (error: any) {
    console.log('chat failed:', error);
    const message = error?.message || 'chat failed';
    return wantsStream ? sseError(message) : respErr(message);
  }
}

export const Route = createFileRoute('/api/chat')({
  server: { handlers: { POST } },
});
