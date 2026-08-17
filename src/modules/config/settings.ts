/**
 * Settings definitions — tabs, groups, and fields.
 *
 * This drives the admin settings UI. Add new settings here
 * and they'll automatically appear in the admin panel.
 */

import { pricingCatalog } from '@/config/pricing';

export interface Setting {
  name: string;
  title: string;
  type: 'text' | 'password' | 'textarea' | 'number' | 'switch' | 'select';
  placeholder?: string;
  options?: { label: string; value: string }[];
  tip?: string;
  group: string;
  tab: string;
  defaultValue?: string;
  rows?: number;
}

export interface SettingGroup {
  name: string;
  title: string;
  description?: string;
  tab: string;
}

export interface SettingTab {
  name: string;
  title: string;
}

function durationPresetFromDays(days?: number): '1m' | '3m' | '1y' | null {
  if (!days || days <= 0) return null;
  if (days >= 365) return '1y';
  if (days >= 90) return '3m';
  if (days >= 30) return '1m';
  return null;
}

function buildDefaultPricingProducts(): string {
  const products = Object.fromEntries(
    Object.values(pricingCatalog)
      .filter(
        (product) =>
          product.priceInCents > 0 && product.productId !== 'trial-starter'
      )
      .map((product) => [
        product.productId,
        {
          amount: product.priceInCents,
          currency: product.currency,
          credits: product.credits,
          type:
            product.fulfillment === 'credits_only'
              ? 'credits_only'
              : product.fulfillment === 'credential'
                ? 'credential'
                : 'generic',
          duration_preset: durationPresetFromDays(product.creditsValidDays),
          max_bindings: product.maxBindings ?? null,
          status: 'active',
        },
      ])
  );

  return JSON.stringify(products, null, 2);
}

const defaultPricingProducts = buildDefaultPricingProducts();

export function getSettingTabs(): SettingTab[] {
  return [
    { name: 'general', title: 'General' },
    { name: 'auth', title: 'Auth' },
    { name: 'payment', title: 'Payment' },
    { name: 'email', title: 'Email' },
    { name: 'storage', title: 'Storage' },
    { name: 'ai', title: 'AI' },
    { name: 'analytics', title: 'Analytics' },
    { name: 'ads', title: 'Ads' },
    { name: 'affiliate', title: 'Affiliate' },
    { name: 'customer_service', title: 'Customer Service' },
    { name: 'referral', title: 'Referral' },
    { name: 'pricing', title: 'Pricing' },
    { name: 'benefits', title: 'Benefits' },
    { name: 'custom', title: 'Custom' },
  ];
}

export function getSettingGroups(): SettingGroup[] {
  return [
    // General
    {
      name: 'appinfo',
      title: 'App Info',
      description: 'Basic application settings',
      tab: 'general',
    },
    {
      name: 'user_role',
      title: 'User Roles',
      description: 'Default role for new users',
      tab: 'general',
    },
    {
      name: 'credit',
      title: 'Credits',
      description: 'Initial credits for new users',
      tab: 'general',
    },

    // Auth
    {
      name: 'email_auth',
      title: 'Email Auth',
      description: 'Email/password authentication',
      tab: 'auth',
    },
    {
      name: 'google_auth',
      title: 'Google Auth',
      description: 'Google OAuth login',
      tab: 'auth',
    },
    {
      name: 'github_auth',
      title: 'GitHub Auth',
      description: 'GitHub OAuth login',
      tab: 'auth',
    },

    // Payment
    {
      name: 'basic_payment',
      title: 'Basic',
      description: 'Payment general settings',
      tab: 'payment',
    },
    {
      name: 'stripe',
      title: 'Stripe',
      description: 'Stripe payment gateway',
      tab: 'payment',
    },
    {
      name: 'creem',
      title: 'Creem',
      description: 'Creem payment gateway',
      tab: 'payment',
    },
    {
      name: 'paypal',
      title: 'PayPal',
      description: 'PayPal payment gateway',
      tab: 'payment',
    },
    {
      name: 'zpay',
      title: 'ZPay',
      description: 'ZPay gateway for Alipay / WeChat Pay',
      tab: 'payment',
    },
    {
      name: 'alipay',
      title: 'Alipay',
      description: 'Alipay payment gateway (native)',
      tab: 'payment',
    },
    {
      name: 'wechat',
      title: 'WeChat Pay',
      description: 'WeChat Pay gateway (native)',
      tab: 'payment',
    },

    // Email
    {
      name: 'email_general',
      title: 'General',
      description: 'Email provider selection',
      tab: 'email',
    },
    {
      name: 'resend',
      title: 'Resend',
      description: 'Resend email service',
      tab: 'email',
    },
    {
      name: 'cloudflare_email',
      title: 'Cloudflare Email',
      description: 'Cloudflare Email Service',
      tab: 'email',
    },

    // Storage
    {
      name: 'r2',
      title: 'Cloudflare R2 / S3',
      description: 'Object storage settings',
      tab: 'storage',
    },

    // AI
    {
      name: 'chat_ai',
      title: 'Chat AI Routing',
      description: 'Chat provider selection and fallback order',
      tab: 'ai',
    },
    {
      name: 'openrouter',
      title: 'OpenRouter',
      description: 'OpenRouter chat completions',
      tab: 'ai',
    },
    {
      name: 'kimi',
      title: 'Kimi',
      description: 'Moonshot/Kimi OpenAI-compatible chat completions',
      tab: 'ai',
    },
    {
      name: 'deepseek',
      title: 'DeepSeek',
      description: 'DeepSeek OpenAI-compatible chat completions',
      tab: 'ai',
    },
    {
      name: 'openai',
      title: 'OpenAI',
      description: 'OpenAI (or compatible) API',
      tab: 'ai',
    },
    {
      name: 'anthropic',
      title: 'Anthropic',
      description: 'Anthropic Claude API',
      tab: 'ai',
    },
    {
      name: 'replicate',
      title: 'Replicate',
      description: 'Replicate AI API',
      tab: 'ai',
    },
    { name: 'fal', title: 'Fal', description: 'Fal AI API', tab: 'ai' },
    {
      name: 'ai_generation',
      title: 'AI Media Generation',
      description: 'Legacy AI image/video/music generation (credit-consuming)',
      tab: 'ai',
    },

    // Analytics
    {
      name: 'google_analytics',
      title: 'Google Analytics',
      description: 'Inject gtag.js with the configured Measurement ID',
      tab: 'analytics',
    },
    {
      name: 'clarity',
      title: 'Clarity',
      description: 'Microsoft Clarity project tracking',
      tab: 'analytics',
    },
    {
      name: 'plausible',
      title: 'Plausible',
      description: 'Inject plausible.js for self-hosted or cloud Plausible',
      tab: 'analytics',
    },
    {
      name: 'openpanel',
      title: 'OpenPanel',
      description: 'OpenPanel analytics client',
      tab: 'analytics',
    },
    {
      name: 'vercel_analytics',
      title: 'Vercel Analytics',
      description: 'Vercel Analytics toggle',
      tab: 'analytics',
    },

    // Ads
    {
      name: 'adsense',
      title: 'AdSense',
      description: 'Google AdSense publisher configuration',
      tab: 'ads',
    },

    // Affiliate
    {
      name: 'affonso',
      title: 'Affonso',
      description: 'Affonso affiliate tracking',
      tab: 'affiliate',
    },
    {
      name: 'promotekit',
      title: 'PromoteKit',
      description: 'PromoteKit affiliate tracking',
      tab: 'affiliate',
    },

    // Customer Service
    {
      name: 'crisp',
      title: 'Crisp',
      description: 'Crisp live chat widget',
      tab: 'customer_service',
    },
    {
      name: 'tawk',
      title: 'Tawk.to',
      description: 'Tawk.to live chat widget',
      tab: 'customer_service',
    },

    // Referral / Pricing / Benefits
    {
      name: 'referral',
      title: 'Referral',
      description: 'Referral and commission settings',
      tab: 'referral',
    },
    {
      name: 'pricing_products',
      title: 'Pricing Products',
      description:
        'Pricing catalog overrides for amount, credits, duration, and status',
      tab: 'pricing',
    },
    {
      name: 'benefit_starter_card',
      title: 'Starter Card',
      description: 'Paid starter-card price and entitlements',
      tab: 'benefits',
    },
    {
      name: 'benefit_starter_survey',
      title: 'Starter Survey Bonus',
      description: 'Post-purchase survey availability extension',
      tab: 'benefits',
    },
    {
      name: 'benefit_experience_feedback',
      title: 'Experience Feedback Reward',
      description: 'Experience feedback reward duration and credits',
      tab: 'benefits',
    },
  ];
}

export function getSettings(): Setting[] {
  return [
    // ─── General / App Info ──────────────────────────────────────────
    {
      name: 'app_name',
      title: 'App Name',
      type: 'text',
      placeholder: 'MediaClaw',
      group: 'appinfo',
      tab: 'general',
    },
    {
      name: 'app_description',
      title: 'App Description',
      type: 'textarea',
      placeholder:
        'MediaClaw helps teams capture, monitor, and operationalize social media intelligence.',
      group: 'appinfo',
      tab: 'general',
    },
    {
      name: 'app_url',
      title: 'App URL',
      type: 'text',
      placeholder: 'https://example.com',
      group: 'appinfo',
      tab: 'general',
    },

    // ─── General / User Roles ────────────────────────────────────────
    {
      name: 'initial_role_enabled',
      title: 'Auto-assign role for new users',
      type: 'switch',
      group: 'user_role',
      tab: 'general',
    },
    {
      name: 'initial_role_name',
      title: 'Default role name',
      type: 'text',
      placeholder: 'viewer',
      group: 'user_role',
      tab: 'general',
    },

    // ─── General / Credits ───────────────────────────────────────────
    {
      name: 'initial_credits_enabled',
      title: 'Grant credits on signup',
      type: 'switch',
      group: 'credit',
      tab: 'general',
    },
    {
      name: 'initial_credits_amount',
      title: 'Credits amount',
      type: 'number',
      placeholder: '100',
      group: 'credit',
      tab: 'general',
    },
    {
      name: 'initial_credits_valid_days',
      title: 'Valid days',
      type: 'number',
      placeholder: '365',
      group: 'credit',
      tab: 'general',
    },
    {
      name: 'initial_credits_description',
      title: 'Description',
      type: 'text',
      placeholder: 'Welcome bonus',
      group: 'credit',
      tab: 'general',
    },

    // ─── Auth / Email ────────────────────────────────────────────────
    {
      name: 'email_auth_enabled',
      title: 'Enable email auth',
      type: 'switch',
      group: 'email_auth',
      tab: 'auth',
      defaultValue: 'true',
    },
    {
      name: 'email_verification_enabled',
      title: 'Require email verification on sign up',
      type: 'switch',
      group: 'email_auth',
      tab: 'auth',
      defaultValue: 'false',
    },
    {
      name: 'invite_code_required',
      title: 'Require invite code on sign up',
      type: 'switch',
      group: 'email_auth',
      tab: 'auth',
      defaultValue: 'false',
    },

    // ─── Auth / Google ───────────────────────────────────────────────
    {
      name: 'google_auth_enabled',
      title: 'Enable Google auth',
      type: 'switch',
      group: 'google_auth',
      tab: 'auth',
    },
    {
      name: 'google_one_tap_enabled',
      title: 'Enable Google One Tap',
      type: 'switch',
      group: 'google_auth',
      tab: 'auth',
      tip: 'Show the Google One Tap prompt to signed-out visitors. Requires Client ID.',
    },
    {
      name: 'google_client_id',
      title: 'Client ID',
      type: 'text',
      placeholder: 'xxx.apps.googleusercontent.com',
      group: 'google_auth',
      tab: 'auth',
    },
    {
      name: 'google_client_secret',
      title: 'Client Secret',
      type: 'password',
      placeholder: 'GOCSPX-xxx',
      group: 'google_auth',
      tab: 'auth',
    },

    // ─── Auth / GitHub ───────────────────────────────────────────────
    {
      name: 'github_auth_enabled',
      title: 'Enable GitHub auth',
      type: 'switch',
      group: 'github_auth',
      tab: 'auth',
    },
    {
      name: 'github_client_id',
      title: 'Client ID',
      type: 'text',
      placeholder: 'Ov23xxx',
      group: 'github_auth',
      tab: 'auth',
    },
    {
      name: 'github_client_secret',
      title: 'Client Secret',
      type: 'password',
      placeholder: 'xxx',
      group: 'github_auth',
      tab: 'auth',
    },

    // ─── Payment / Basic ─────────────────────────────────────────────
    {
      name: 'select_payment_enabled',
      title: 'Show payment method selector',
      type: 'switch',
      group: 'basic_payment',
      tab: 'payment',
    },
    {
      name: 'default_payment_provider',
      title: 'Default provider',
      type: 'select',
      options: [
        { label: 'Stripe', value: 'stripe' },
        { label: 'Creem', value: 'creem' },
        { label: 'PayPal', value: 'paypal' },
        { label: 'ZPay', value: 'zpay' },
        { label: 'Alipay', value: 'alipay' },
        { label: 'WeChat Pay', value: 'wechat' },
      ],
      group: 'basic_payment',
      tab: 'payment',
    },

    // ─── Payment / Stripe ────────────────────────────────────────────
    {
      name: 'stripe_enabled',
      title: 'Enable Stripe',
      type: 'switch',
      group: 'stripe',
      tab: 'payment',
    },
    {
      name: 'stripe_publishable_key',
      title: 'Publishable Key',
      type: 'text',
      placeholder: 'pk_xxx',
      group: 'stripe',
      tab: 'payment',
    },
    {
      name: 'stripe_secret_key',
      title: 'Secret Key',
      type: 'password',
      placeholder: 'sk_xxx',
      group: 'stripe',
      tab: 'payment',
    },
    {
      name: 'stripe_signing_secret',
      title: 'Webhook Signing Secret',
      type: 'password',
      placeholder: 'whsec_xxx',
      group: 'stripe',
      tab: 'payment',
    },

    // ─── Payment / Creem ─────────────────────────────────────────────
    {
      name: 'creem_enabled',
      title: 'Enable Creem',
      type: 'switch',
      group: 'creem',
      tab: 'payment',
    },
    {
      name: 'creem_environment',
      title: 'Environment',
      type: 'select',
      options: [
        { label: 'Sandbox', value: 'sandbox' },
        { label: 'Production', value: 'production' },
      ],
      group: 'creem',
      tab: 'payment',
      defaultValue: 'sandbox',
    },
    {
      name: 'creem_api_key',
      title: 'API Key',
      type: 'password',
      placeholder: 'creem_xxx',
      group: 'creem',
      tab: 'payment',
    },
    {
      name: 'creem_signing_secret',
      title: 'Signing Secret',
      type: 'password',
      placeholder: 'whsec_xxx',
      group: 'creem',
      tab: 'payment',
    },
    {
      name: 'creem_product_ids_mapping',
      title: 'Product IDs Mapping',
      type: 'textarea',
      placeholder: '{"pro-1m": "prod_xxx"}',
      tip: 'Map the product_id in pricing catalog to the product ID created in Creem. Must be a valid JSON object.',
      group: 'creem',
      tab: 'payment',
    },
    {
      name: 'creem_test_amount',
      title: 'Test amount (cents)',
      type: 'number',
      placeholder: '留空使用实际金额，填 1 则支付 $0.01',
      group: 'creem',
      tab: 'payment',
    },

    // ─── Payment / PayPal ────────────────────────────────────────────
    {
      name: 'paypal_enabled',
      title: 'Enable PayPal',
      type: 'switch',
      group: 'paypal',
      tab: 'payment',
    },
    {
      name: 'paypal_client_id',
      title: 'Client ID',
      type: 'text',
      placeholder: 'xxx',
      group: 'paypal',
      tab: 'payment',
    },
    {
      name: 'paypal_client_secret',
      title: 'Client Secret',
      type: 'password',
      placeholder: 'xxx',
      group: 'paypal',
      tab: 'payment',
    },
    {
      name: 'paypal_webhook_id',
      title: 'Webhook ID',
      type: 'text',
      placeholder: 'xxx',
      group: 'paypal',
      tab: 'payment',
    },
    {
      name: 'paypal_environment',
      title: 'Environment',
      type: 'select',
      options: [
        { label: 'Sandbox', value: 'sandbox' },
        { label: 'Live', value: 'live' },
      ],
      group: 'paypal',
      tab: 'payment',
    },
    {
      name: 'paypal_test_amount',
      title: 'Test amount (cents)',
      type: 'number',
      placeholder: '留空使用实际金额，填 1 则支付 $0.01',
      group: 'paypal',
      tab: 'payment',
    },

    // ─── Payment / ZPay ────────────────────────────────────────────────
    {
      name: 'zpay_enabled',
      title: 'Enable ZPay',
      type: 'switch',
      group: 'zpay',
      tab: 'payment',
    },
    {
      name: 'zpay_pid',
      title: 'ZPay PID',
      type: 'text',
      placeholder: '2026031411590962',
      tip: 'ZPay merchant ID from zpayz.cn',
      group: 'zpay',
      tab: 'payment',
    },
    {
      name: 'zpay_pkey',
      title: 'ZPay PKEY',
      type: 'password',
      placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      tip: 'ZPay merchant key from zpayz.cn',
      group: 'zpay',
      tab: 'payment',
    },

    // ─── Payment / Alipay ─────────────────────────────────────────────
    {
      name: 'alipay_enabled',
      title: 'Enable Alipay',
      type: 'switch',
      group: 'alipay',
      tab: 'payment',
    },
    {
      name: 'alipay_app_id',
      title: 'App ID',
      type: 'text',
      placeholder: '2021xxx',
      group: 'alipay',
      tab: 'payment',
    },
    {
      name: 'alipay_private_key',
      title: 'Private Key (RSA2)',
      type: 'textarea',
      placeholder: 'MIIEvQIBADANBgkq...',
      group: 'alipay',
      tab: 'payment',
    },
    {
      name: 'alipay_public_key',
      title: 'Alipay Public Key',
      type: 'textarea',
      placeholder: 'MIIBIjANBgkq...',
      group: 'alipay',
      tab: 'payment',
    },
    {
      name: 'alipay_notify_url',
      title: 'Notify URL (Webhook)',
      type: 'text',
      placeholder: 'https://hersoul.cn/api/payment/notify/alipay',
      group: 'alipay',
      tab: 'payment',
    },
    {
      name: 'alipay_test_amount',
      title: 'Test amount (分)',
      type: 'number',
      placeholder: '留空使用实际金额，填 1 则支付 ¥0.01',
      group: 'alipay',
      tab: 'payment',
    },

    // ─── Payment / WeChat Pay ───────────────────────────────────────
    {
      name: 'wechat_enabled',
      title: 'Enable WeChat Pay',
      type: 'switch',
      group: 'wechat',
      tab: 'payment',
    },
    {
      name: 'wechat_app_id',
      title: 'AppID',
      type: 'text',
      placeholder: 'wx1234567890',
      group: 'wechat',
      tab: 'payment',
    },
    {
      name: 'wechat_mch_id',
      title: 'Merchant ID (商户号)',
      type: 'text',
      placeholder: '1900000001',
      group: 'wechat',
      tab: 'payment',
    },
    {
      name: 'wechat_api_v3_key',
      title: 'APIv3 Key (32位密钥)',
      type: 'password',
      placeholder: '32 chars',
      group: 'wechat',
      tab: 'payment',
    },
    {
      name: 'wechat_private_key',
      title: 'Merchant Private Key (PEM)',
      type: 'textarea',
      placeholder: 'MIIEvgIBADANBgkq...',
      group: 'wechat',
      tab: 'payment',
    },
    {
      name: 'wechat_serial_no',
      title: 'Certificate Serial No',
      type: 'text',
      placeholder: 'xxx',
      group: 'wechat',
      tab: 'payment',
    },
    {
      name: 'wechat_notify_url',
      title: 'Notify URL (Webhook)',
      type: 'text',
      placeholder: 'https://hersoul.cn/api/payment/notify/wechat',
      group: 'wechat',
      tab: 'payment',
    },
    {
      name: 'wechat_test_amount',
      title: 'Test amount (分)',
      type: 'number',
      placeholder: '留空使用实际金额，填 1 则支付 ¥0.01',
      group: 'wechat',
      tab: 'payment',
    },

    // ─── Email / General ────────────────────────────────────────────
    {
      name: 'email_provider',
      title: 'Email Provider',
      type: 'select',
      options: [
        { label: 'Resend', value: 'resend' },
        { label: 'Cloudflare Email', value: 'cloudflare' },
      ],
      group: 'email_general',
      tab: 'email',
      defaultValue: 'resend',
    },

    // ─── Email / Resend ──────────────────────────────────────────────
    {
      name: 'resend_api_key',
      title: 'API Key',
      type: 'password',
      placeholder: 're_xxx',
      group: 'resend',
      tab: 'email',
    },
    {
      name: 'resend_sender_email',
      title: 'Sender Email',
      type: 'text',
      placeholder: 'support@mediaclaw.app',
      group: 'resend',
      tab: 'email',
    },

    // ─── Email / Cloudflare Email ────────────────────────────────────
    {
      name: 'cloudflare_email_api_token',
      title: 'API Token',
      type: 'password',
      placeholder: 'Bearer token with Email Send permission',
      group: 'cloudflare_email',
      tab: 'email',
    },
    {
      name: 'cloudflare_email_account_id',
      title: 'Account ID',
      type: 'text',
      placeholder: 'Cloudflare account ID',
      group: 'cloudflare_email',
      tab: 'email',
    },
    {
      name: 'cloudflare_email_sender_email',
      title: 'Sender Email',
      type: 'text',
      placeholder: 'support@mediaclaw.app',
      group: 'cloudflare_email',
      tab: 'email',
    },

    // ─── Storage / R2 ────────────────────────────────────────────────
    // Keep the legacy `r2_*` keys so existing DB config is read as-is.
    {
      name: 'r2_access_key',
      title: 'Cloudflare Access Key',
      type: 'text',
      placeholder: '',
      group: 'r2',
      tab: 'storage',
    },
    {
      name: 'r2_secret_key',
      title: 'Cloudflare Secret Key',
      type: 'password',
      placeholder: '',
      group: 'r2',
      tab: 'storage',
    },
    {
      name: 'r2_bucket_name',
      title: 'Bucket Name',
      type: 'text',
      placeholder: '',
      group: 'r2',
      tab: 'storage',
    },
    {
      name: 'r2_upload_path',
      title: 'Upload Path',
      type: 'text',
      placeholder: 'uploads',
      tip: 'Path to upload files to; leave empty to use the default. Example: uploads/foo/bar',
      group: 'r2',
      tab: 'storage',
    },
    {
      name: 'r2_endpoint',
      title: 'Endpoint',
      type: 'text',
      placeholder: 'https://<account-id>.r2.cloudflarestorage.com',
      tip: 'Leave empty to use the default R2 endpoint',
      group: 'r2',
      tab: 'storage',
    },
    {
      name: 'r2_domain',
      title: 'Domain',
      type: 'text',
      placeholder: 'https://cdn.example.com',
      group: 'r2',
      tab: 'storage',
    },

    // ─── AI / OpenAI ─────────────────────────────────────────────────
    {
      name: 'openai_base_url',
      title: 'Base URL',
      type: 'text',
      placeholder: 'https://api.openai.com/v1',
      group: 'openai',
      tab: 'ai',
    },
    {
      name: 'openai_api_key',
      title: 'API Key',
      type: 'password',
      placeholder: 'sk-xxx',
      group: 'openai',
      tab: 'ai',
    },

    // ─── AI / Anthropic ──────────────────────────────────────────────
    {
      name: 'anthropic_base_url',
      title: 'Base URL',
      type: 'text',
      placeholder: 'https://api.anthropic.com',
      group: 'anthropic',
      tab: 'ai',
    },
    {
      name: 'anthropic_api_key',
      title: 'API Key',
      type: 'password',
      placeholder: 'sk-ant-xxx',
      group: 'anthropic',
      tab: 'ai',
    },

    // ─── AI / Media Generation ───────────────────────────────────────
    {
      name: 'ai_generation_enabled',
      title: 'Enable AI Media Generation',
      type: 'switch',
      group: 'ai_generation',
      tab: 'ai',
      tip: 'Allow the legacy /api/ai/generate endpoint to create credit-consuming AI tasks. Disabled by default; all current product features live in the browser plugin.',
    },

    // ─── AI / Replicate ──────────────────────────────────────────────
    {
      name: 'replicate_api_token',
      title: 'API Token',
      type: 'password',
      placeholder: 'r8_xxx',
      group: 'replicate',
      tab: 'ai',
    },

    // ─── AI / Fal ────────────────────────────────────────────────────
    {
      name: 'fal_api_key',
      title: 'API Key',
      type: 'password',
      placeholder: 'xxx',
      group: 'fal',
      tab: 'ai',
    },

    // ─── AI / Chat Routing ───────────────────────────────────────────
    {
      name: 'chat_ai_provider',
      title: 'Default Chat Provider',
      type: 'select',
      options: [
        { label: 'OpenRouter', value: 'openrouter' },
        { label: 'Kimi', value: 'kimi' },
        { label: 'DeepSeek', value: 'deepseek' },
      ],
      group: 'chat_ai',
      tab: 'ai',
      defaultValue: 'openrouter',
    },
    {
      name: 'chat_ai_fallback_providers',
      title: 'Fallback Providers',
      type: 'text',
      placeholder: 'kimi,deepseek,openrouter',
      tip: 'Comma-separated provider fallback order used when the primary chat provider fails.',
      group: 'chat_ai',
      tab: 'ai',
    },

    // ─── AI / OpenRouter ─────────────────────────────────────────────
    {
      name: 'openrouter_api_key',
      title: 'API Key',
      type: 'password',
      placeholder: 'sk-or-xxx',
      group: 'openrouter',
      tab: 'ai',
    },
    {
      name: 'openrouter_base_url',
      title: 'Base URL',
      type: 'text',
      placeholder: 'https://openrouter.ai/api/v1',
      group: 'openrouter',
      tab: 'ai',
    },
    {
      name: 'openrouter_model',
      title: 'Default Model',
      type: 'text',
      placeholder: 'deepseek/deepseek-chat',
      group: 'openrouter',
      tab: 'ai',
    },
    {
      name: 'openrouter_http_referer',
      title: 'HTTP Referer',
      type: 'text',
      placeholder: 'https://mediaclaw.com',
      group: 'openrouter',
      tab: 'ai',
    },
    {
      name: 'openrouter_x_title',
      title: 'X-Title',
      type: 'text',
      placeholder: 'MediaClaw',
      group: 'openrouter',
      tab: 'ai',
    },

    // ─── AI / Kimi ───────────────────────────────────────────────────
    {
      name: 'kimi_api_key',
      title: 'API Key',
      type: 'password',
      placeholder: 'sk-xxx',
      group: 'kimi',
      tab: 'ai',
    },
    {
      name: 'kimi_base_url',
      title: 'Base URL',
      type: 'text',
      placeholder: 'https://api.moonshot.cn/v1',
      group: 'kimi',
      tab: 'ai',
    },
    {
      name: 'kimi_model',
      title: 'Default Model',
      type: 'text',
      placeholder: 'kimi-k2.5',
      group: 'kimi',
      tab: 'ai',
    },

    // ─── AI / DeepSeek ───────────────────────────────────────────────
    {
      name: 'deepseek_api_key',
      title: 'API Key',
      type: 'password',
      placeholder: 'sk-xxx',
      group: 'deepseek',
      tab: 'ai',
    },
    {
      name: 'deepseek_base_url',
      title: 'Base URL',
      type: 'text',
      placeholder: 'https://api.deepseek.com/v1',
      group: 'deepseek',
      tab: 'ai',
    },
    {
      name: 'deepseek_model',
      title: 'Default Model',
      type: 'text',
      placeholder: 'deepseek-chat',
      group: 'deepseek',
      tab: 'ai',
    },

    // ─── Analytics / Google Analytics ────────────────────────────────
    {
      name: 'google_analytics_id',
      title: 'Measurement ID',
      type: 'text',
      placeholder: 'G-XXXXXXXXXX',
      group: 'google_analytics',
      tab: 'analytics',
    },

    // ─── Analytics / Clarity ───────────────────────────────────────────
    {
      name: 'clarity_id',
      title: 'Clarity ID',
      type: 'text',
      placeholder: 'xxxxxxxxxx',
      group: 'clarity',
      tab: 'analytics',
      defaultValue: 'xj860xja7v',
    },

    // ─── Analytics / Plausible ───────────────────────────────────────
    {
      name: 'plausible_domain',
      title: 'Domain',
      type: 'text',
      placeholder: 'example.com',
      tip: 'The domain registered in your Plausible dashboard',
      group: 'plausible',
      tab: 'analytics',
    },
    {
      name: 'plausible_src',
      title: 'Script Src',
      type: 'text',
      placeholder: 'https://plausible.io/js/script.js',
      tip: 'Use https://plausible.io/js/script.js for cloud, or your self-hosted URL',
      group: 'plausible',
      tab: 'analytics',
    },

    // ─── Analytics / OpenPanel ────────────────────────────────────────
    {
      name: 'openpanel_client_id',
      title: 'OpenPanel Client ID',
      type: 'text',
      placeholder: 'op_...',
      group: 'openpanel',
      tab: 'analytics',
    },

    // ─── Analytics / Vercel Analytics ─────────────────────────────────
    {
      name: 'vercel_analytics_enabled',
      title: 'Enable Vercel Analytics',
      type: 'switch',
      group: 'vercel_analytics',
      tab: 'analytics',
      defaultValue: 'false',
    },

    // ─── Ads / AdSense ────────────────────────────────────────────────
    {
      name: 'adsense_code',
      title: 'AdSense Publisher Code',
      type: 'text',
      placeholder: 'ca-pub-xxx',
      group: 'adsense',
      tab: 'ads',
    },

    // ─── Affiliate / Affonso ──────────────────────────────────────────
    {
      name: 'affonso_enabled',
      title: 'Enable Affonso',
      type: 'switch',
      group: 'affonso',
      tab: 'affiliate',
      defaultValue: 'false',
    },
    {
      name: 'affonso_id',
      title: 'Affonso ID',
      type: 'text',
      placeholder: 'xxx',
      tip: 'Affonso Program ID',
      group: 'affonso',
      tab: 'affiliate',
    },
    {
      name: 'affonso_cookie_duration',
      title: 'Cookie duration (days)',
      type: 'number',
      placeholder: '30',
      tip: 'Affonso cookie duration in days',
      group: 'affonso',
      tab: 'affiliate',
      defaultValue: '30',
    },

    // ─── Affiliate / PromoteKit ───────────────────────────────────────
    {
      name: 'promotekit_enabled',
      title: 'Enable PromoteKit',
      type: 'switch',
      group: 'promotekit',
      tab: 'affiliate',
      defaultValue: 'false',
    },
    {
      name: 'promotekit_id',
      title: 'PromoteKit ID',
      type: 'text',
      placeholder: 'xxx',
      tip: 'PromoteKit Program ID',
      group: 'promotekit',
      tab: 'affiliate',
    },

    // ─── Customer Service / Crisp ───────────────────────────────────
    {
      name: 'crisp_enabled',
      title: 'Enable Crisp',
      type: 'switch',
      group: 'crisp',
      tab: 'customer_service',
    },
    {
      name: 'crisp_website_id',
      title: 'Website ID',
      type: 'text',
      placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      group: 'crisp',
      tab: 'customer_service',
    },

    // ─── Customer Service / Tawk.to ─────────────────────────────────
    {
      name: 'tawk_enabled',
      title: 'Enable Tawk.to',
      type: 'switch',
      group: 'tawk',
      tab: 'customer_service',
    },
    {
      name: 'tawk_property_id',
      title: 'Property ID',
      type: 'text',
      placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxx',
      group: 'tawk',
      tab: 'customer_service',
    },
    {
      name: 'tawk_widget_id',
      title: 'Widget ID',
      type: 'text',
      placeholder: '1xxxxx/default',
      group: 'tawk',
      tab: 'customer_service',
    },

    // ─── Referral / Commission ───────────────────────────────────────
    {
      name: 'referral_enabled',
      title: 'Referral Enabled',
      type: 'switch',
      group: 'referral',
      tab: 'referral',
      tip: 'Enable or disable the referral program',
      defaultValue: 'true',
    },
    {
      name: 'referral_first_order_rate',
      title: 'First Order Commission Rate (%)',
      type: 'number',
      placeholder: '20',
      group: 'referral',
      tab: 'referral',
      tip: 'Commission rate for first order from referred users (0-100)',
      defaultValue: '20',
    },
    {
      name: 'referral_renewal_rate',
      title: 'Renewal Commission Rate (%)',
      type: 'number',
      placeholder: '20',
      group: 'referral',
      tab: 'referral',
      tip: 'Commission rate for renewal orders from referred users (0-100)',
      defaultValue: '20',
    },
    {
      name: 'referral_invitee_discount',
      title: 'Invitee Discount (%)',
      type: 'number',
      placeholder: '10',
      group: 'referral',
      tab: 'referral',
      tip: 'Discount for new users who sign up with a referral code (0-100)',
      defaultValue: '10',
    },
    {
      name: 'referral_min_settlement',
      title: 'Minimum Settlement Amount (cents)',
      type: 'number',
      placeholder: '10000',
      group: 'referral',
      tab: 'referral',
      tip: 'Minimum amount required before commission can be settled. 10000 = ¥100',
      defaultValue: '10000',
    },
    {
      name: 'referral_lock_days',
      title: 'Commission Lock Period (days)',
      type: 'number',
      placeholder: '7',
      group: 'referral',
      tab: 'referral',
      tip: 'Number of days commission is locked before it can be settled',
      defaultValue: '7',
    },
    {
      name: 'referral_max_refund_rate',
      title: 'Max Refund Rate (%)',
      type: 'number',
      placeholder: '30',
      group: 'referral',
      tab: 'referral',
      tip: 'Maximum allowed refund rate before referrer is suspended (0-100)',
      defaultValue: '30',
    },

    // ─── Pricing / Products ───────────────────────────────────────────
    {
      name: 'pricing_products',
      title: 'Pricing Products (JSON)',
      type: 'textarea',
      placeholder: defaultPricingProducts,
      group: 'pricing_products',
      tab: 'pricing',
      tip: 'Configure each product_id with amount (cents), currency, credits, type, duration_preset, max_bindings, and status.',
      defaultValue: defaultPricingProducts,
      rows: 20,
    },

    // ─── Benefits / Channel Survey ────────────────────────────────────
    {
      name: 'benefit_starter_card_enabled',
      title: 'Enable starter card',
      type: 'switch',
      group: 'benefit_starter_card',
      tab: 'benefits',
      defaultValue: 'true',
    },
    {
      name: 'benefit_starter_card_price_cents',
      title: 'Starter card price (cents)',
      type: 'number',
      group: 'benefit_starter_card',
      tab: 'benefits',
      tip: '900 = ¥9. The same amount is used for the first-subscription deduction.',
      defaultValue: '900',
    },
    {
      name: 'benefit_starter_card_duration_days',
      title: 'Starter card membership days',
      type: 'number',
      group: 'benefit_starter_card',
      tab: 'benefits',
      defaultValue: '5',
    },
    {
      name: 'benefit_starter_card_credits',
      title: 'Starter card credits',
      type: 'number',
      group: 'benefit_starter_card',
      tab: 'benefits',
      tip: 'Starter-card credits never expire.',
      defaultValue: '50',
    },
    {
      name: 'benefit_starter_survey_enabled',
      title: 'Enable post-purchase survey bonus',
      type: 'switch',
      group: 'benefit_starter_survey',
      tab: 'benefits',
      defaultValue: 'true',
    },
    {
      name: 'benefit_starter_survey_bonus_days',
      title: 'Post-purchase survey bonus days',
      type: 'number',
      group: 'benefit_starter_survey',
      tab: 'benefits',
      tip: 'Extends the active paid starter card. The survey no longer grants credits or free trial codes.',
      defaultValue: '2',
    },

    // ─── Benefits / Experience Feedback ───────────────────────────────
    {
      name: 'benefit_experience_feedback_enabled',
      title: 'Enable experience feedback reward',
      type: 'switch',
      group: 'benefit_experience_feedback',
      tab: 'benefits',
      defaultValue: 'true',
    },
    {
      name: 'benefit_experience_feedback_duration_days',
      title: 'Experience feedback extra days',
      type: 'number',
      group: 'benefit_experience_feedback',
      tab: 'benefits',
      tip: 'Extends an active activation code. This reward no longer creates a free trial code.',
      defaultValue: '5',
    },
    {
      name: 'benefit_experience_feedback_credits',
      title: 'Experience feedback extra credits',
      type: 'number',
      group: 'benefit_experience_feedback',
      tab: 'benefits',
      defaultValue: '0',
    },
  ];
}
