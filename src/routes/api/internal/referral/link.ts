import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { getReferralExtensionLink } from '@/modules/referral/service';

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
    const userId = String(body?.userId || '').trim();
    if (!userId) {
      return Response.json(
        {
          ok: false,
          reason: 'credential_unclaimed',
          message: 'userId is required',
        },
        { status: 400 }
      );
    }

    const result = await getReferralExtensionLink(userId);
    if (!result.ok) {
      return Response.json(result, {
        status: result.reason === 'referral_disabled' ? 409 : 400,
      });
    }

    return Response.json({
      ok: true,
      data: {
        inviteCode: result.inviteCode,
        referralLink: result.referralLink,
      },
    });
  } catch (error) {
    console.error('[internal/referral/link] failed', error);
    return Response.json(
      {
        ok: false,
        reason: 'referral_unavailable',
        message: 'Referral link is temporarily unavailable',
      },
      { status: 500 }
    );
  }
}

export const Route = createFileRoute('/api/internal/referral/link')({
  server: { handlers: { POST } },
});
