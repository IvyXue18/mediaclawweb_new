import { createFileRoute } from '@tanstack/react-router';

async function GET({ params }: { params: { _splat?: string } }) {
  const key = String(params._splat || '').replace(/^\/+/, '');
  if (!key) return new Response('Not found', { status: 404 });

  try {
    const response = await fetch(`https://media.mediaclaw.app/${key}`);
    if (!response.ok) {
      return new Response('Not found', { status: response.status });
    }

    const headers = new Headers();
    headers.set(
      'content-type',
      response.headers.get('content-type') || 'application/octet-stream'
    );
    headers.set('cache-control', 'public, max-age=31536000, immutable');

    return new Response(response.body, { headers });
  } catch {
    return new Response('Internal server error', { status: 500 });
  }
}

export const Route = createFileRoute('/api/media/$')({
  server: { handlers: { GET } },
});
