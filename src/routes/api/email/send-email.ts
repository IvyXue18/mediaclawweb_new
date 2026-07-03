import { createFileRoute } from '@tanstack/react-router';

import {
  CloudflareEmailProvider,
  ResendProvider,
  type EmailProvider,
} from '@/core/email';
import { getAllConfigs } from '@/modules/config/service';
import { respData, respErr } from '@/lib/resp';

import { requireAdmin } from '../admin/-compat';

async function getEmailProvider(): Promise<EmailProvider> {
  const configs = await getAllConfigs();
  const provider = configs.email_provider || 'resend';

  if (provider === 'cloudflare') {
    if (
      !configs.cloudflare_email_api_token ||
      !configs.cloudflare_email_account_id ||
      !configs.cloudflare_email_sender_email
    ) {
      throw new Error('Cloudflare email is not configured');
    }

    return new CloudflareEmailProvider({
      apiToken: configs.cloudflare_email_api_token,
      accountId: configs.cloudflare_email_account_id,
      defaultFrom: configs.cloudflare_email_sender_email,
    });
  }

  if (!configs.resend_api_key || !configs.resend_sender_email) {
    throw new Error('Resend email is not configured');
  }

  return new ResendProvider({
    apiKey: configs.resend_api_key,
    defaultFrom: configs.resend_sender_email,
  });
}

async function POST({ request }: { request: Request }) {
  try {
    await requireAdmin(request);
    const { emails, subject, html, text } = await request.json();
    const to = Array.isArray(emails) ? emails : [emails].filter(Boolean);

    if (to.length === 0 || !subject) {
      return respErr('emails and subject are required');
    }

    const provider = await getEmailProvider();
    const result = await provider.sendEmail({
      to,
      subject,
      html,
      text: text || (!html ? 'MediaClaw verification code: 123455' : undefined),
    });

    return respData(result);
  } catch (error: any) {
    return respErr(error.message || 'send email failed');
  }
}

export const Route = createFileRoute('/api/email/send-email')({
  server: { handlers: { POST } },
});
