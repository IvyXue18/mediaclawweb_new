import { createFileRoute } from '@tanstack/react-router';

import { pluginOk } from './-plugin-compat';

async function GET() {
  return pluginOk(
    {
      service: 'mediaclawweb',
      health: 'ok',
    },
    'health ok'
  );
}

export const Route = createFileRoute('/api/health')({
  server: { handlers: { GET } },
});
