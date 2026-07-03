import { describe, expect, it, vi } from 'vitest';

import {
  requestChatCompletionWithFallback,
  resolveChatProviderConfig,
  resolveChatProviderOrder,
} from '@/modules/chat/provider';

const messages = [{ role: 'user' as const, content: 'hello' }];

describe('chat provider fallback', () => {
  it('orders the preferred provider, configured fallbacks, then remaining configured providers', () => {
    expect(
      resolveChatProviderOrder(
        {
          chat_ai_provider: 'openrouter',
          chat_ai_fallback_providers: 'kimi, deepseek, openrouter',
          openrouter_api_key: 'or-key',
          kimi_api_key: 'kimi-key',
          deepseek_api_key: 'deepseek-key',
        },
        null
      )
    ).toEqual(['openrouter', 'kimi', 'deepseek']);
  });

  it('normalizes provider API config without duplicating chat completions path', () => {
    const config = resolveChatProviderConfig(
      'openrouter',
      {
        openrouter_api_key: 'or-key',
        openrouter_base_url: 'https://openrouter.ai/api/v1/chat/completions',
        app_url: 'https://mediaclaw.example',
        app_name: 'MediaClaw',
      },
      'openai/gpt-5'
    );

    expect(config).toMatchObject({
      provider: 'openrouter',
      apiKey: 'or-key',
      baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'openai/gpt-5',
      headers: {
        'HTTP-Referer': 'https://mediaclaw.example',
        'X-Title': 'MediaClaw',
      },
    });
  });

  it('falls back from OpenRouter to DeepSeek and records attempts', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'bad gateway' } }), {
          status: 502,
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: 'ok' } }],
          }),
          { status: 200 }
        )
      );

    const result = await requestChatCompletionWithFallback({
      configs: {
        chat_ai_provider: 'openrouter',
        chat_ai_fallback_providers: 'deepseek',
        openrouter_api_key: 'or-key',
        openrouter_base_url: 'https://openrouter.ai/api/v1',
        deepseek_api_key: 'deepseek-key',
        deepseek_base_url: 'https://api.deepseek.com/v1',
        deepseek_model: 'deepseek-chat',
      },
      preferredProvider: 'openrouter',
      model: 'deepseek/deepseek-r1',
      messages,
      stream: false,
      fetcher,
    });

    expect(result.provider).toBe('deepseek');
    expect(result.model).toBe('deepseek-reasoner');
    expect(result.attempts).toEqual([
      {
        provider: 'openrouter',
        model: 'deepseek/deepseek-r1',
        ok: false,
        error: 'openrouter request failed (502): bad gateway',
      },
      {
        provider: 'deepseek',
        model: 'deepseek-reasoner',
        ok: true,
      },
    ]);
    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer or-key',
        }),
      })
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      'https://api.deepseek.com/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer deepseek-key',
        }),
        body: JSON.stringify({
          model: 'deepseek-reasoner',
          messages,
          stream: false,
        }),
      })
    );
  });

  it('reports all missing provider keys instead of silently pretending chat works', async () => {
    await expect(
      requestChatCompletionWithFallback({
        configs: {
          chat_ai_provider: 'kimi',
          chat_ai_fallback_providers: 'openrouter',
        },
        preferredProvider: 'kimi',
        model: 'moonshotai/kimi-k2-thinking',
        messages,
      })
    ).rejects.toThrow(
      'All chat AI providers failed. kimi: kimi api key is not configured; openrouter: openrouter api key is not configured'
    );
  });
});
