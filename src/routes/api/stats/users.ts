import { createFileRoute } from '@tanstack/react-router';

import { getUserSocialProof } from '@/modules/user-stats/service';
import { respData, respErr } from '@/lib/resp';

async function GET() {
  try {
    const response = respData(await getUserSocialProof());
    response.headers.set('Cache-Control', 'public, max-age=600');
    return response;
  } catch (e) {
    console.error('get user social proof failed', e);
    return respErr('get user stats failed');
  }
}

export const Route = createFileRoute('/api/stats/users')({
  server: {
    handlers: { GET },
  },
});
