import {
  getWelfareFeedbackTask,
  isMissingBenefitTaskTable,
} from '@/shared/models/benefit';
import { getUserInfo } from '@/shared/models/user';

export async function GET() {
  try {
    const user = await getUserInfo();
    if (!user?.id) {
      return respErr('no auth, please sign in');
    }

    const feedbackTask = await getWelfareFeedbackTask(user.id);
    return respData({ feedbackTask });
  } catch (error) {
    if (isMissingBenefitTaskTable(error)) {
      return respErr('benefit center is not initialized');
    }

    return respErr('get experience feedback reward failed');
  }
}

export async function POST() {
  try {
    const user = await getUserInfo();
    if (!user?.id) {
      return respErr('no auth, please sign in');
    }

    return respErr('experience_feedback_plugin_only');
  } catch (error: any) {
    if (isMissingBenefitTaskTable(error)) {
      return respErr('benefit center is not initialized');
    }

    return respErr(error?.message || 'submit experience feedback failed');
  }
}

function respData(data: any) {
  return Response.json({ code: 0, message: 'ok', data });
}

function respErr(message: string) {
  return Response.json({ code: -1, message });
}
