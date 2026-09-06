import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { recordPluginMessageEvent } from '@/modules/plugin-messages/service';

const EVENTS = new Set(['impression', 'read', 'dismiss', 'action']);

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
    const event = String(body?.event || '');
    if (!subjectKey || !EVENTS.has(event)) {
      return Response.json(
        { ok: false, reason: 'invalid_request', message: 'Invalid event' },
        { status: 400 }
      );
    }
    const result = await recordPluginMessageEvent({
      subjectKey,
      messageIds: Array.isArray(body?.messageIds) ? body.messageIds : [],
      event: event as 'impression' | 'read' | 'dismiss' | 'action',
    });
    return Response.json({ ok: true, data: result });
  } catch (error) {
    console.error('[internal/plugin-messages/event] failed', error);
    return Response.json(
      {
        ok: false,
        reason: 'message_event_unavailable',
        message: 'Message event is temporarily unavailable',
      },
      { status: 500 }
    );
  }
}

export const Route = createFileRoute('/api/internal/plugin-messages/event')({
  server: { handlers: { POST } },
});
