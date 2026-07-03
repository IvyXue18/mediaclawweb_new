import { createFileRoute } from '@tanstack/react-router';

import { respData } from '@/lib/resp';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function withCors(response: Response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

async function POST({ request }: { request: Request }) {
  const body = await request.json().catch(() => ({}));
  const eventName =
    body && typeof body === 'object' && 'eventName' in body
      ? String(body.eventName || '').slice(0, 120)
      : '';

  return withCors(
    respData({
      accepted: true,
      eventName: eventName || 'unknown',
    })
  );
}

export const Route = createFileRoute('/api/analytics/events')({
  server: {
    handlers: { OPTIONS, POST },
  },
});
