import { createFileRoute } from '@tanstack/react-router';

import {
  getChannelSurveyTask,
  grantChannelSurveyReward,
  isBrowserTrialAlreadyClaimedError,
  isMissingBenefitTaskTable,
} from '@/modules/benefits/service';
import { respData, respErr } from '@/lib/resp';
import { recordServerAnalyticsEvent } from '@/lib/server-analytics';

import { requireUser } from '../user/-compat';

async function GET({ request }: { request: Request }) {
  try {
    const user = await requireUser(request);
    const task = await getChannelSurveyTask(user.id);
    return respData({ task });
  } catch (error: any) {
    if (isMissingBenefitTaskTable(error)) {
      return respErr('benefit center is not initialized');
    }
    return respErr(error?.message || 'get channel survey reward failed');
  }
}

async function POST({ request }: { request: Request }) {
  let userId = '';
  let body: any = {};
  try {
    const user = await requireUser(request);
    userId = user.id;
    body = await request.json();
    const result = await grantChannelSurveyReward({
      userId: user.id,
      surveySource: body?.surveySource,
      surveyRole: body?.surveyRole,
      surveyUseCase: body?.surveyUseCase,
      surveyDetail: body?.surveyDetail,
      rewardCredentialId: body?.rewardCredentialId,
      entryPoint: body?.entryPoint,
      browserInstallId: body?.browserInstallId,
      urlSource: body?.urlSource,
      feature: body?.feature,
      intent: body?.intent,
      reason: body?.reason,
      installId: body?.installId,
    });

    return respData(result);
  } catch (error: any) {
    if (userId) {
      await recordServerAnalyticsEvent({
        eventName: 'trial_claim_failed',
        source: 'server',
        userId,
        properties: {
          taskType: 'channel_survey',
          surveySource: body?.surveySource,
          surveyRole: body?.surveyRole,
          surveyUseCase: body?.surveyUseCase,
          entryPoint: body?.entryPoint,
          urlSource: body?.urlSource,
          feature: body?.feature,
          intent: body?.intent,
          reason: body?.reason,
          installId: body?.installId,
          errorReason: error?.message || 'submit channel survey reward failed',
        },
      });
    }
    if (isMissingBenefitTaskTable(error)) {
      return respErr('benefit center is not initialized');
    }
    if (isBrowserTrialAlreadyClaimedError(error)) {
      return respErr('browser_trial_already_claimed');
    }
    return respErr(error?.message || 'submit channel survey reward failed');
  }
}

export const Route = createFileRoute('/api/rewards/channel-survey')({
  server: { handlers: { GET, POST } },
});
