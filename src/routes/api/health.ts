import { createFileRoute } from '@tanstack/react-router';

import { respData } from '@/lib/resp';

async function GET() {
  return respData({
    service: 'mediaclawweb',
    health: 'ok',
  });
}

export const Route = createFileRoute('/api/health')({
  server: { handlers: { GET } },
});
