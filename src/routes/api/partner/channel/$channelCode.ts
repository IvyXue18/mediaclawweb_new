import { createFileRoute } from '@tanstack/react-router';

import { listPricingProducts } from '@/config/pricing';
import {
  findPartnerByBusinessId,
  isPartnerCurrentlyActive,
  partnerDashboardShape,
} from '@/modules/partners/service';
import { respData, respErr } from '@/lib/resp';

async function GET({ params }: { params: { channelCode: string } }) {
  try {
    const row = await findPartnerByBusinessId(params.channelCode);
    if (!row || !isPartnerCurrentlyActive(row)) {
      return respErr('partner channel not found');
    }

    const products = listPricingProducts()
      .filter((item) => item.priceInCents > 0)
      .map((item) => ({
        productId: item.productId,
        name: item.productName || item.planName || item.productId,
        amount: item.priceInCents,
        currency: item.currency,
      }));

    return respData({
      partner: partnerDashboardShape(row),
      products,
    });
  } catch (error: any) {
    return respErr(error.message || 'Load partner channel failed');
  }
}

export const Route = createFileRoute('/api/partner/channel/$channelCode')({
  server: {
    handlers: { GET },
  },
});
