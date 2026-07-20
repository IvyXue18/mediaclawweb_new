import { createFileRoute } from '@tanstack/react-router';

import { getBenefitRewardConfig } from '@/modules/benefits/service';
import { getStarterProduct } from '@/modules/starter/service';
import { respData, respErr } from '@/lib/resp';

export async function GET() {
  try {
    const [product, benefits] = await Promise.all([
      getStarterProduct({ bypassCache: true }),
      getBenefitRewardConfig({ bypassCache: true }),
    ]);
    const response = respData({
      enabled: !product.status || product.status === 'active',
      priceInCents: product.priceInCents,
      durationDays: product.durationDays || 0,
      credits: product.credits,
      currency: product.currency,
      surveyEnabled: benefits.channel_survey.enabled,
      surveyBonusDays: benefits.channel_survey.existingCredential.durationDays,
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error: any) {
    return respErr(error?.message || 'get starter product failed');
  }
}

export const Route = createFileRoute('/api/starter/product')({
  server: { handlers: { GET } },
});
