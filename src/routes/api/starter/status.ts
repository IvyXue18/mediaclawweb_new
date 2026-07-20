import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getStarterChannelSurveyTask } from '@/modules/benefits/service';
import { getStarterStatus } from '@/modules/starter/service';
import { respData, respErr } from '@/lib/resp';

/**
 * GET /api/starter/status
 *
 * 9 元全能卡状态：是否可购买、已购卡信息、问卷加时是否已完成、抵扣资格。
 * 福利中心 Hero 卡与支付成功页共用。
 */
async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return respErr('Unauthorized');
    }

    const url = new URL(request.url);
    const status = await getStarterStatus(
      session.user.id,
      url.searchParams.get('browser_install_id') || undefined
    );
    const surveyTask = status.paidTrial
      ? await getStarterChannelSurveyTask(
          session.user.id,
          status.paidTrial.credentialId
        ).catch(() => null)
      : null;

    return respData({
      ...status,
      surveyCompleted: surveyTask?.status === 'completed',
    });
  } catch (error: any) {
    console.error('starter status error:', error);
    return respErr(error?.message || 'starter status failed');
  }
}

export const Route = createFileRoute('/api/starter/status')({
  server: {
    handlers: { GET },
  },
});
