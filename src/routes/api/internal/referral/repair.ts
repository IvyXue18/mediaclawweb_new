import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { processPendingReferralTasks } from '@/modules/referral/service';

function assertInternalToken(request: Request) {
  const token = request.headers.get('x-internal-token') || '';
  const expectedToken =
    envConfigs.referral_cron_token || envConfigs.auth_secret || '';
  return !!expectedToken && token === expectedToken;
}

async function POST({ request }: { request: Request }) {
  try {
    if (!assertInternalToken(request)) {
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await processPendingReferralTasks();

    return Response.json({
      ok: true,
      message: 'Referral repair tasks processed',
    });
  } catch (error: any) {
    return Response.json(
      { ok: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const Route = createFileRoute('/api/internal/referral/repair')({
  server: { handlers: { POST } },
});
