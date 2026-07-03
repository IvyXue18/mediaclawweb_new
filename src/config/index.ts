export const AUTH_SECRET_PLACEHOLDER =
  'shipany-dev-secret-change-in-production';

// Isomorphic env access:
// - Public (client-visible) vars are VITE_-prefixed and read from
//   import.meta.env (statically injected into the client bundle by Vite).
// - Server-only vars (secrets) are read from process.env and resolve to ''
//   in the browser — they never reach the client bundle.
const metaEnv: Record<string, string | undefined> =
  (import.meta as any).env ?? {};
const procEnv: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? process.env : {};

const publicEnv = (key: string) => metaEnv[key] ?? procEnv[key];

export const envConfigs: Record<string, string> = {
  // App (public)
  app_url: publicEnv('VITE_APP_URL') ?? 'http://localhost:3000',
  app_name: publicEnv('VITE_APP_NAME') ?? 'MediaClaw',
  app_description:
    publicEnv('VITE_APP_DESCRIPTION') ??
    'MediaClaw helps teams capture, monitor, and operationalize social media intelligence.',
  app_logo: publicEnv('VITE_APP_LOGO') ?? '/logo.png',

  // Database
  database_url: procEnv.DATABASE_URL ?? '',
  database_auth_token: procEnv.DATABASE_AUTH_TOKEN ?? '',
  database_provider: procEnv.DATABASE_PROVIDER ?? 'sqlite',
  db_schema: procEnv.DB_SCHEMA ?? 'public',
  db_singleton_enabled: procEnv.DB_SINGLETON_ENABLED ?? 'false',
  db_max_connections: procEnv.DB_MAX_CONNECTIONS ?? '1',

  // Auth
  auth_url: procEnv.AUTH_URL ?? publicEnv('VITE_APP_URL') ?? '',
  auth_secret: procEnv.AUTH_SECRET ?? '',
  license_internal_token: procEnv.LICENSE_INTERNAL_TOKEN ?? '',
  referral_cron_token: procEnv.REFERRAL_CRON_TOKEN ?? '',
  credit_cron_token: procEnv.CREDIT_CRON_TOKEN ?? '',

  // Payment - Stripe
  stripe_secret_key: procEnv.STRIPE_SECRET_KEY ?? '',
  stripe_publishable_key: procEnv.STRIPE_PUBLISHABLE_KEY ?? '',
  stripe_signing_secret: procEnv.STRIPE_SIGNING_SECRET ?? '',

  // Payment - PayPal
  paypal_client_id: procEnv.PAYPAL_CLIENT_ID ?? '',
  paypal_client_secret: procEnv.PAYPAL_CLIENT_SECRET ?? '',
  paypal_webhook_id: procEnv.PAYPAL_WEBHOOK_ID ?? '',
  paypal_environment: procEnv.PAYPAL_ENVIRONMENT ?? 'production',

  // Payment - Zpay / Epay clone
  zpay_pid: procEnv.ZPAY_PID ?? '',
  zpay_pkey: procEnv.ZPAY_PKEY ?? '',

  // Payment - Alipay
  alipay_app_id: procEnv.ALIPAY_APP_ID ?? '',
  alipay_private_key: procEnv.ALIPAY_PRIVATE_KEY ?? '',
  alipay_public_key: procEnv.ALIPAY_PUBLIC_KEY ?? '',
  alipay_notify_url: procEnv.ALIPAY_NOTIFY_URL ?? '',

  // Payment - WeChat Pay
  wechat_app_id: procEnv.WECHAT_APP_ID ?? '',
  wechat_mch_id: procEnv.WECHAT_MCH_ID ?? '',
  wechat_api_v3_key: procEnv.WECHAT_API_V3_KEY ?? '',
  wechat_private_key: procEnv.WECHAT_PRIVATE_KEY ?? '',
  wechat_serial_no: procEnv.WECHAT_SERIAL_NO ?? '',
  wechat_notify_url: procEnv.WECHAT_NOTIFY_URL ?? '',
  wechat_platform_cert: procEnv.WECHAT_PLATFORM_CERT ?? '',

  // Email - Resend
  resend_api_key: procEnv.RESEND_API_KEY ?? '',
  resend_sender_email:
    procEnv.RESEND_SENDER_EMAIL ?? procEnv.RESEND_EMAIL_FROM ?? '',

  // Storage - S3/R2
  storage_endpoint: procEnv.STORAGE_ENDPOINT ?? '',
  storage_region: procEnv.STORAGE_REGION ?? 'auto',
  storage_access_key: procEnv.STORAGE_ACCESS_KEY ?? '',
  storage_secret_key: procEnv.STORAGE_SECRET_KEY ?? '',
  storage_bucket: procEnv.STORAGE_BUCKET ?? '',
  storage_public_domain: procEnv.STORAGE_PUBLIC_DOMAIN ?? '',
  inline_image_max_kb: procEnv.INLINE_IMAGE_MAX_KB ?? '2048',

  // AI
  // OpenAI / Anthropic are admin-panel-only (like Gemini/Fal). No env fallback:
  // OPENAI_API_KEY / ANTHROPIC_API_KEY are common ambient vars, and falling back
  // to them would let the admin "Test" silently pass on the machine's own key.
  replicate_api_token: procEnv.REPLICATE_API_TOKEN ?? '',
  chat_ai_provider: procEnv.CHAT_AI_PROVIDER ?? 'openrouter',
  chat_ai_fallback_providers: procEnv.CHAT_AI_FALLBACK_PROVIDERS ?? '',
  kimi_api_key: procEnv.KIMI_API_KEY ?? '',
  kimi_base_url:
    procEnv.KIMI_BASE_URL ??
    procEnv.KIMI_API_BASE_URL ??
    'https://api.moonshot.cn/v1',
  kimi_model: procEnv.KIMI_MODEL ?? 'kimi-k2.5',
  deepseek_api_key: procEnv.DEEPSEEK_API_KEY ?? '',
  deepseek_base_url:
    procEnv.DEEPSEEK_BASE_URL ??
    procEnv.DEEPSEEK_API_BASE_URL ??
    'https://api.deepseek.com/v1',
  deepseek_model: procEnv.DEEPSEEK_MODEL ?? 'deepseek-chat',
  openrouter_api_key: procEnv.OPENROUTER_API_KEY ?? '',
  openrouter_base_url:
    procEnv.OPENROUTER_BASE_URL ??
    procEnv.OPENROUTER_API_BASE_URL ??
    'https://openrouter.ai/api/v1',
  openrouter_model: procEnv.OPENROUTER_MODEL ?? 'deepseek/deepseek-chat',
  openrouter_http_referer: procEnv.OPENROUTER_HTTP_REFERER ?? '',
  openrouter_x_title: procEnv.OPENROUTER_X_TITLE ?? '',

  // Locale (public)
  locale: publicEnv('VITE_DEFAULT_LOCALE') ?? 'zh',
};
