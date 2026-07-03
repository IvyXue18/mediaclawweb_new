import { POST } from '@/routes/api/chat';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createChatMessage: vi.fn(),
  findChatById: vi.fn(),
  getUuid: vi.fn(),
  getChatMessages: vi.fn(),
  getAllConfigs: vi.fn(),
}));

vi.mock('@/routes/api/user/-compat', () => ({
  requireUser: vi.fn(async () => ({ id: 'user-1' })),
}));

vi.mock('@/modules/chat/service', () => ({
  ChatMessageStatus: {
    CREATED: 'created',
  },
  createChatMessage: (...args: any[]) => mocks.createChatMessage(...args),
  findChatById: (...args: any[]) => mocks.findChatById(...args),
  getChatMessages: (...args: any[]) => mocks.getChatMessages(...args),
}));

vi.mock('@/modules/config/service', () => ({
  getAllConfigs: (...args: any[]) => mocks.getAllConfigs(...args),
}));

vi.mock('@/lib/hash', () => ({
  getUuid: (...args: any[]) => mocks.getUuid(...args),
}));

function jsonRequest(body: unknown) {
  return new Request('https://mediaclaw.example/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function streamResponseBody(chunks: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

describe('/api/chat provider fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUuid
      .mockReturnValueOnce('msg-user-1')
      .mockReturnValueOnce('msg-assistant-1');
    mocks.findChatById.mockResolvedValue({
      id: 'chat-1',
      userId: 'user-1',
      provider: 'openrouter',
    });
    mocks.getChatMessages.mockResolvedValue([
      {
        role: 'user',
        parts: JSON.stringify([{ type: 'text', text: 'hello' }]),
      },
    ]);
    mocks.createChatMessage.mockResolvedValue(undefined);
    mocks.getAllConfigs.mockResolvedValue({
      app_url: 'https://mediaclaw.example',
      app_name: 'MediaClaw',
      chat_ai_fallback_providers: 'deepseek',
      openrouter_api_key: 'or-key',
      openrouter_base_url: 'https://openrouter.ai/api/v1',
      deepseek_api_key: 'deepseek-key',
      deepseek_base_url: 'https://api.deepseek.com/v1',
      deepseek_model: 'deepseek-chat',
    });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: { message: 'bad gateway' } }), {
            status: 502,
          })
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: 'fallback reply',
                  },
                  finish_reason: 'stop',
                },
              ],
            }),
            { status: 200 }
          )
        )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores the assistant message with the provider that actually responded', async () => {
    const response = await POST({
      request: jsonRequest({
        chatId: 'chat-1',
        model: 'deepseek/deepseek-r1',
        message: {
          parts: [{ type: 'text', text: 'hello' }],
        },
      }),
    });

    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data.metadata.provider).toBe('deepseek');
    expect(body.data.metadata.model).toBe('deepseek-reasoner');

    expect(mocks.createChatMessage).toHaveBeenCalledTimes(2);
    expect(mocks.createChatMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'msg-assistant-1',
        role: 'assistant',
        provider: 'deepseek',
        model: 'deepseek-reasoner',
        parts: JSON.stringify([
          {
            type: 'text',
            text: 'fallback reply',
          },
        ]),
      })
    );
  });

  it('prepends stream provider metadata so the chat UI can show fallback state', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: { message: 'bad gateway' } }), {
            status: 502,
          })
        )
        .mockResolvedValueOnce(
          new Response(
            streamResponseBody([
              'data: {"choices":[{"delta":{"content":"stream "}}]}\n\n',
              'data: {"choices":[{"delta":{"content":"reply"}}]}\n\n',
              'data: [DONE]\n\n',
            ]),
            { status: 200 }
          )
        )
    );

    const response = await POST({
      request: jsonRequest({
        chatId: 'chat-1',
        model: 'deepseek/deepseek-r1',
        message: {
          parts: [{ type: 'text', text: 'hello' }],
        },
        stream: true,
      }),
    });

    const body = await response.text();

    expect(response.headers.get('Content-Type')).toContain('text/event-stream');
    expect(body).toContain('event: meta');
    expect(body).toContain('"type":"chat_provider_meta"');
    expect(body).toContain('"provider":"deepseek"');
    expect(body).toContain('"model":"deepseek-reasoner"');
    expect(body).toContain('"ok":false');
    expect(body).toContain('"content":"stream "');
    expect(body).toContain('"content":"reply"');

    expect(mocks.createChatMessage).toHaveBeenCalledTimes(2);
    expect(mocks.createChatMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'msg-assistant-1',
        role: 'assistant',
        provider: 'deepseek',
        model: 'deepseek-reasoner',
        parts: JSON.stringify([
          {
            type: 'text',
            text: 'stream reply',
          },
        ]),
        metadata: expect.stringContaining('"attempts"'),
      })
    );
  });
});
