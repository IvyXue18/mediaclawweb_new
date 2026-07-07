export const AUTH_SECRET_PLACEHOLDER =
  'mediaclaw-dev-secret-change-in-production';

// Isomorphic env access:
// - Public (client-visible) vars are VITE_-prefixed and read from
//   import.meta.env (statically injected into the client bundle by Vite).
// - Server-only vars (secrets) are read lazily from process.env or the
//   Cloudflare Workers env object exposed by Nitro (`globalThis.__env__`).
//   In the browser those runtime env objects are absent, so secrets still
//   resolve to '' and never reach the client bundle.
const metaEnv: Record<string, string | undefined> =
  (import.meta as any).env ?? {};

function serverEnv(key: string): string | undefined {
  const procEnv: Record<string, string | undefined> =
    typeof process !== 'undefined' && process.env ? process.env : {};
  const g = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
  const cfEnv = (g.__CF_ENV__ ?? g.__env__) as
    | Record<string, unknown>
    | undefined;
  const procValue = procEnv[key];
  if (typeof procValue === 'string' && procValue.length > 0) {
    return procValue;
  }

  const cfValue = cfEnv?.[key];
  return typeof cfValue === 'string' && cfValue.length > 0
    ? cfValue
    : undefined;
}

const publicEnv = (key: string) => metaEnv[key] ?? serverEnv(key);

const envConfigReaders = {
  // App (public)
  app_url: () => publicEnv('VITE_APP_URL') ?? 'http://localhost:3000',
  app_name: () => publicEnv('VITE_APP_NAME') ?? 'MediaClaw',
  app_description: () =>
    publicEnv('VITE_APP_DESCRIPTION') ??
    'MediaClaw helps teams capture, monitor, and operationalize social media intelligence.',
  app_logo: () => publicEnv('VITE_APP_LOGO') ?? '/logo.png',

  // Database
  database_url: () => serverEnv('DATABASE_URL') ?? '',
  database_auth_token: () => serverEnv('DATABASE_AUTH_TOKEN') ?? '',
  database_provider: () => serverEnv('DATABASE_PROVIDER') ?? 'sqlite',
  db_schema: () => serverEnv('DB_SCHEMA') ?? 'public',
  db_singleton_enabled: () => serverEnv('DB_SINGLETON_ENABLED') ?? 'false',
  db_max_connections: () => serverEnv('DB_MAX_CONNECTIONS') ?? '1',

  // Auth
  auth_url: () => serverEnv('AUTH_URL') ?? publicEnv('VITE_APP_URL') ?? '',
  auth_secret: () => serverEnv('AUTH_SECRET') ?? '',
  local_api_proxy_origin: () => serverEnv('LOCAL_API_PROXY_ORIGIN') ?? '',
  license_internal_token: () => serverEnv('LICENSE_INTERNAL_TOKEN') ?? '',
  referral_cron_token: () => serverEnv('REFERRAL_CRON_TOKEN') ?? '',
  credit_cron_token: () => serverEnv('CREDIT_CRON_TOKEN') ?? '',

  // Payment - Stripe
  stripe_secret_key: () => serverEnv('STRIPE_SECRET_KEY') ?? '',
  stripe_publishable_key: () => serverEnv('STRIPE_PUBLISHABLE_KEY') ?? '',
  stripe_signing_secret: () => serverEnv('STRIPE_SIGNING_SECRET') ?? '',

  // Payment - PayPal
  paypal_client_id: () => serverEnv('PAYPAL_CLIENT_ID') ?? '',
  paypal_client_secret: () => serverEnv('PAYPAL_CLIENT_SECRET') ?? '',
  paypal_webhook_id: () => serverEnv('PAYPAL_WEBHOOK_ID') ?? '',
  paypal_environment: () => serverEnv('PAYPAL_ENVIRONMENT') ?? 'production',

  // Payment - Zpay / Epay clone
  zpay_pid: () => serverEnv('ZPAY_PID') ?? '',
  zpay_pkey: () => serverEnv('ZPAY_PKEY') ?? '',

  // Payment - Alipay
  alipay_app_id: () => serverEnv('ALIPAY_APP_ID') ?? '',
  alipay_private_key: () => serverEnv('ALIPAY_PRIVATE_KEY') ?? '',
  alipay_public_key: () => serverEnv('ALIPAY_PUBLIC_KEY') ?? '',
  alipay_notify_url: () => serverEnv('ALIPAY_NOTIFY_URL') ?? '',

  // Payment - WeChat Pay
  wechat_app_id: () => serverEnv('WECHAT_APP_ID') ?? '',
  wechat_mch_id: () => serverEnv('WECHAT_MCH_ID') ?? '',
  wechat_api_v3_key: () => serverEnv('WECHAT_API_V3_KEY') ?? '',
  wechat_private_key: () => serverEnv('WECHAT_PRIVATE_KEY') ?? '',
  wechat_serial_no: () => serverEnv('WECHAT_SERIAL_NO') ?? '',
  wechat_notify_url: () => serverEnv('WECHAT_NOTIFY_URL') ?? '',
  wechat_platform_cert: () => serverEnv('WECHAT_PLATFORM_CERT') ?? '',

  // Email - Resend
  resend_api_key: () => serverEnv('RESEND_API_KEY') ?? '',
  resend_sender_email: () =>
    serverEnv('RESEND_SENDER_EMAIL') ?? serverEnv('RESEND_EMAIL_FROM') ?? '',

  // Storage - S3/R2
  storage_endpoint: () => serverEnv('STORAGE_ENDPOINT') ?? '',
  storage_region: () => serverEnv('STORAGE_REGION') ?? 'auto',
  storage_access_key: () => serverEnv('STORAGE_ACCESS_KEY') ?? '',
  storage_secret_key: () => serverEnv('STORAGE_SECRET_KEY') ?? '',
  storage_bucket: () => serverEnv('STORAGE_BUCKET') ?? '',
  storage_public_domain: () => serverEnv('STORAGE_PUBLIC_DOMAIN') ?? '',
  inline_image_max_kb: () => serverEnv('INLINE_IMAGE_MAX_KB') ?? '2048',

  // AI
  // OpenAI / Anthropic are admin-panel-only (like Gemini/Fal). No env fallback:
  // OPENAI_API_KEY / ANTHROPIC_API_KEY are common ambient vars, and falling back
  // to them would let the admin "Test" silently pass on the machine's own key.
  replicate_api_token: () => serverEnv('REPLICATE_API_TOKEN') ?? '',
  chat_ai_provider: () => serverEnv('CHAT_AI_PROVIDER') ?? 'openrouter',
  chat_ai_fallback_providers: () =>
    serverEnv('CHAT_AI_FALLBACK_PROVIDERS') ?? '',
  kimi_api_key: () => serverEnv('KIMI_API_KEY') ?? '',
  kimi_base_url: () =>
    serverEnv('KIMI_BASE_URL') ??
    serverEnv('KIMI_API_BASE_URL') ??
    'https://api.moonshot.cn/v1',
  kimi_model: () => serverEnv('KIMI_MODEL') ?? 'kimi-k2.5',
  deepseek_api_key: () => serverEnv('DEEPSEEK_API_KEY') ?? '',
  deepseek_base_url: () =>
    serverEnv('DEEPSEEK_BASE_URL') ??
    serverEnv('DEEPSEEK_API_BASE_URL') ??
    'https://api.deepseek.com/v1',
  deepseek_model: () => serverEnv('DEEPSEEK_MODEL') ?? 'deepseek-chat',
  openrouter_api_key: () => serverEnv('OPENROUTER_API_KEY') ?? '',
  openrouter_base_url: () =>
    serverEnv('OPENROUTER_BASE_URL') ??
    serverEnv('OPENROUTER_API_BASE_URL') ??
    'https://openrouter.ai/api/v1',
  openrouter_model: () =>
    serverEnv('OPENROUTER_MODEL') ?? 'deepseek/deepseek-chat',
  openrouter_http_referer: () => serverEnv('OPENROUTER_HTTP_REFERER') ?? '',
  openrouter_x_title: () => serverEnv('OPENROUTER_X_TITLE') ?? '',

  // Locale (public)
  locale: () => publicEnv('VITE_DEFAULT_LOCALE') ?? 'zh',
};

export const envConfigs: Record<string, string> = new Proxy(
  {} as Record<string, string>,
  {
    get(_target, prop: string | symbol) {
      if (typeof prop !== 'string') return undefined;
      const reader = envConfigReaders[prop as keyof typeof envConfigReaders];
      return reader ? reader() : undefined;
    },
    has(_target, prop: string | symbol) {
      return typeof prop === 'string' && prop in envConfigReaders;
    },
    ownKeys() {
      return Reflect.ownKeys(envConfigReaders);
    },
    getOwnPropertyDescriptor(_target, prop: string | symbol) {
      if (typeof prop !== 'string' || !(prop in envConfigReaders))
        return undefined;
      return { enumerable: true, configurable: true };
    },
  }
);
