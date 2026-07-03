import { createFileRoute } from '@tanstack/react-router';

import {
  getWelfareFeedbackTask,
  isMissingBenefitTaskTable,
} from '@/modules/benefits/service';
import { respData, respErr } from '@/lib/resp';

import { requireUser } from '../user/-compat';

async function GET({ request }: { request: Request }) {
  try {
    const user = await requireUser(request);
    const feedbackTask = await getWelfareFeedbackTask(user.id);
    return respData({ feedbackTask });
  } catch (error: any) {
    if (isMissingBenefitTaskTable(error)) {
      return respErr('benefit center is not initialized');
    }
    return respErr(error?.message || 'get experience feedback reward failed');
  }
}

async function POST({ request }: { request: Request }) {
  try {
    await requireUser(request);
    return respErr('experience_feedback_plugin_only');
  } catch (error: any) {
    if (isMissingBenefitTaskTable(error)) {
      return respErr('benefit center is not initialized');
    }
    return respErr(error?.message || 'submit experience feedback failed');
  }
}

export const Route = createFileRoute('/api/rewards/experience-feedback')({
  server: { handlers: { GET, POST } },
});
