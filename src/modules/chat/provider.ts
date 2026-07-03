export type ChatProviderName = 'openrouter' | 'kimi' | 'deepseek';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type ChatProviderConfig = {
  provider: ChatProviderName;
  apiKey: string;
  baseUrl: string;
  model: string;
  headers: Record<string, string>;
};

type ChatCompletionAttempt = {
  provider: ChatProviderName;
  model: string;
  ok: boolean;
  error?: string;
};

type RequestChatCompletionInput = {
  configs: Record<string, string>;
  preferredProvider?: string | null;
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  fetcher?: typeof fetch;
};

const CHAT_PROVIDERS: ChatProviderName[] = ['openrouter', 'kimi', 'deepseek'];

function clean(value?: string | null) {
  return String(value || '').trim();
}

function normalizeKimiModel(value: string) {
  const model = clean(value);
  if (!model) return 'kimi-k2.5';
  if (model.toLowerCase() === 'kimik2.5') return 'kimi-k2.5';
  return model;
}

function normalizeDeepseekModel(value: string) {
  const model = clean(value);
  if (!model) return 'deepseek-chat';
  if (/deepseek\/deepseek-r1/i.test(model)) return 'deepseek-reasoner';
  if (/deepseek\/deepseek-chat|deepseek\/deepseek-v3/i.test(model)) {
    return 'deepseek-chat';
  }
  return model;
}

function selectedModelForDirectProvider(
  provider: ChatProviderName,
  selectedModel: string
) {
  const model = clean(selectedModel);
  if (!model) return '';
  if (provider === 'kimi' && /^kimi/i.test(model) && !model.includes('/')) {
    return model;
  }
  if (provider === 'deepseek' && /^deepseek/i.test(model)) {
    return model;
  }
  return '';
}

function splitProviders(value?: string | null) {
  return clean(value)
    .split(/[,，]/)
    .map((item) => normalizeChatProvider(item))
    .filter((item): item is ChatProviderName => Boolean(item));
}

function uniqueProviders(providers: ChatProviderName[]) {
  const seen = new Set<ChatProviderName>();
  return providers.filter((provider) => {
    if (seen.has(provider)) return false;
    seen.add(provider);
    return true;
  });
}

function apiKeyFor(
  provider: ChatProviderName,
  configs: Record<string, string>
) {
  if (provider === 'openrouter') return clean(configs.openrouter_api_key);
  if (provider === 'kimi') return clean(configs.kimi_api_key);
  return clean(configs.deepseek_api_key);
}

function chatCompletionsUrl(baseUrl: string) {
  const trimmed = clean(baseUrl).replace(/\/+$/, '');
  if (!trimmed) return '';
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed;
  return `${trimmed}/chat/completions`;
}

function errorFromPayload(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const data = payload as Record<string, any>;
  const candidates = [data.message, data.msg, data.error?.message, data.error];
  for (const candidate of candidates) {
    const message = clean(candidate);
    if (message) return message;
  }
  return fallback;
}

async function readError(response: Response, provider: ChatProviderName) {
  const text = await response.text().catch(() => '');
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text };
  }
  const detail = errorFromPayload(
    payload,
    `request failed with status ${response.status}`
  );
  return `${provider} request failed (${response.status}): ${detail}`;
}

export function normalizeChatProvider(
  value?: string | null
): ChatProviderName | null {
  const provider = clean(value).toLowerCase();
  return CHAT_PROVIDERS.includes(provider as ChatProviderName)
    ? (provider as ChatProviderName)
    : null;
}

export function resolveChatProviderOrder(
  configs: Record<string, string>,
  preferredProvider?: string | null
) {
  const preferred =
    normalizeChatProvider(preferredProvider) ||
    normalizeChatProvider(configs.chat_ai_provider) ||
    normalizeChatProvider(configs.monitor_ai_provider) ||
    'openrouter';
  const fallbacks = splitProviders(
    configs.chat_ai_fallback_providers ||
      configs.monitor_ai_fallback_providers ||
      ''
  );
  const configured = CHAT_PROVIDERS.filter((provider) =>
    apiKeyFor(provider, configs)
  );

  return uniqueProviders([preferred, ...fallbacks, ...configured]);
}

export function resolveChatProviderConfig(
  provider: ChatProviderName,
  configs: Record<string, string>,
  selectedModel: string
): ChatProviderConfig {
  if (provider === 'openrouter') {
    return {
      provider,
      apiKey: apiKeyFor(provider, configs),
      baseUrl:
        clean(configs.openrouter_base_url) ||
        clean(configs.openrouter_api_base_url) ||
        'https://openrouter.ai/api/v1',
      model:
        clean(selectedModel) ||
        clean(configs.openrouter_model) ||
        'deepseek/deepseek-chat',
      headers: {
        'HTTP-Referer':
          clean(configs.openrouter_http_referer) ||
          clean(configs.app_url) ||
          'http://localhost:3000',
        'X-Title':
          clean(configs.openrouter_x_title) ||
          clean(configs.app_name) ||
          'MediaClaw',
      },
    };
  }

  if (provider === 'kimi') {
    return {
      provider,
      apiKey: apiKeyFor(provider, configs),
      baseUrl:
        clean(configs.kimi_base_url) ||
        clean(configs.kimi_api_base_url) ||
        'https://api.moonshot.cn/v1',
      model: normalizeKimiModel(
        selectedModelForDirectProvider(provider, selectedModel) ||
          clean(configs.kimi_model)
      ),
      headers: {},
    };
  }

  return {
    provider,
    apiKey: apiKeyFor(provider, configs),
    baseUrl:
      clean(configs.deepseek_base_url) ||
      clean(configs.deepseek_api_base_url) ||
      'https://api.deepseek.com/v1',
    model: normalizeDeepseekModel(
      selectedModelForDirectProvider(provider, selectedModel) ||
        clean(configs.deepseek_model)
    ),
    headers: {},
  };
}

export async function requestChatCompletionWithFallback({
  configs,
  preferredProvider,
  model,
  messages,
  stream,
  fetcher = fetch,
}: RequestChatCompletionInput): Promise<{
  response: Response;
  provider: ChatProviderName;
  model: string;
  attempts: ChatCompletionAttempt[];
}> {
  const providers = resolveChatProviderOrder(configs, preferredProvider);
  const attempts: ChatCompletionAttempt[] = [];

  for (const provider of providers) {
    const providerConfig = resolveChatProviderConfig(provider, configs, model);
    if (!providerConfig.apiKey) {
      attempts.push({
        provider,
        model: providerConfig.model,
        ok: false,
        error: `${provider} api key is not configured`,
      });
      continue;
    }

    const url = chatCompletionsUrl(providerConfig.baseUrl);
    if (!url) {
      attempts.push({
        provider,
        model: providerConfig.model,
        ok: false,
        error: `${provider} base url is not configured`,
      });
      continue;
    }

    try {
      const response = await fetcher(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${providerConfig.apiKey}`,
          'Content-Type': 'application/json',
          ...providerConfig.headers,
        },
        body: JSON.stringify({
          model: providerConfig.model,
          messages,
          stream: Boolean(stream),
        }),
      });

      if (!response.ok) {
        const error = await readError(response, provider);
        attempts.push({
          provider,
          model: providerConfig.model,
          ok: false,
          error,
        });
        continue;
      }

      attempts.push({
        provider,
        model: providerConfig.model,
        ok: true,
      });
      return {
        response,
        provider,
        model: providerConfig.model,
        attempts,
      };
    } catch (error: any) {
      attempts.push({
        provider,
        model: providerConfig.model,
        ok: false,
        error: error?.message || `${provider} request failed`,
      });
    }
  }

  const details = attempts
    .map((attempt) => `${attempt.provider}: ${attempt.error}`)
    .join('; ');
  throw new Error(
    details
      ? `All chat AI providers failed. ${details}`
      : 'No chat AI provider is configured'
  );
}
