import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { getPluginMessageFeed } from '@/modules/plugin-messages/service';

function hasInternalAccess(request: Request) {
  const expected = String(envConfigs.license_internal_token || '').trim();
  const provided = String(request.headers.get('x-internal-token') || '').trim();
  return Boolean(expected) && provided === expected;
}

export async function POST({ request }: { request: Request }) {
  if (!hasInternalAccess(request)) {
    return Response.json(
      { ok: false, reason: 'unauthorized', message: 'Unauthorized' },
      { status: 401 }
    );
  }
  try {
    const body = await request.json().catch(() => ({}));
    const subjectKey = String(body?.subjectKey || '')
      .trim()
      .slice(0, 191);
    if (!subjectKey) {
      return Response.json(
        {
          ok: false,
          reason: 'invalid_request',
          message: 'subjectKey required',
        },
        { status: 400 }
      );
    }
    const result = await getPluginMessageFeed({
      subjectKey,
      context: {
        authStatus: String(body?.context?.authStatus || 'unbound'),
        planCode: String(body?.context?.planCode || ''),
        variantId: String(body?.context?.variantId || 'official'),
        locale: String(body?.context?.locale || ''),
        userId: String(body?.context?.userId || ''),
        appVersion: String(body?.context?.appVersion || ''),
        usageDays: Number(body?.context?.usageDays) || 0,
        successfulOperationCount:
          Number(body?.context?.successfulOperationCount) || 0,
        outputActionCount: Number(body?.context?.outputActionCount) || 0,
      },
    });
    return Response.json({ ok: true, data: result });
  } catch (error) {
    console.error('[internal/plugin-messages/feed] failed', error);
    return Response.json(
      {
        ok: false,
        reason: 'message_feed_unavailable',
        message: 'Message feed is temporarily unavailable',
      },
      { status: 500 }
    );
  }
}

export const Route = createFileRoute('/api/internal/plugin-messages/feed')({
  server: { handlers: { POST } },
});
