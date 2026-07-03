import { createFileRoute } from '@tanstack/react-router';

import {
  listBenefitRewardLedgers,
  listChannelSurveyResponses,
  listExperienceFeedbackResponses,
} from '@/modules/benefits/service';
import { respErr, respPage } from '@/lib/resp';

import { getPagination, requireAdmin } from './-compat';

const REWARD_KINDS = new Set([
  'channel-survey',
  'experience-feedback',
  'ledger',
]);

async function GET({ request }: { request: Request }) {
  try {
    await requireAdmin(request);

    const { page, pageSize, searchParams } = getPagination(request);
    const kind = searchParams.get('kind') || 'channel-survey';
    if (!REWARD_KINDS.has(kind)) {
      return respErr('Unsupported reward kind');
    }

    const search = searchParams.get('search');
    const credentialCode = searchParams.get('credentialCode');

    if (kind === 'experience-feedback') {
      const ratingValue = Number(searchParams.get('rating') || 0);
      const result = await listExperienceFeedbackResponses({
        page,
        pageSize,
        rating: Number.isFinite(ratingValue) ? ratingValue : null,
        credentialCode,
        search,
      });
      return respPage(result.items, result.total);
    }

    if (kind === 'ledger') {
      const result = await listBenefitRewardLedgers({
        page,
        pageSize,
        taskType: searchParams.get('taskType'),
        status: searchParams.get('status'),
        credentialCode,
        search,
      });
      return respPage(result.items, result.total);
    }

    const result = await listChannelSurveyResponses({
      page,
      pageSize,
      source: searchParams.get('source'),
      credentialCode,
      search,
    });
    return respPage(result.items, result.total);
  } catch (error: any) {
    return respErr(error.message || 'List reward records failed');
  }
}

export const Route = createFileRoute('/api/admin/rewards')({
  server: { handlers: { GET } },
});

export { GET };
