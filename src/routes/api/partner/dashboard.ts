import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { listPricingProducts } from '@/config/pricing';
import {
  findPartnerByUserId,
  getPartnerCredentials,
  getPartnerCredentialsCount,
  getPartnerCredentialStats,
  getPartnerOrders,
  isPartnerCurrentlyActive,
  partnerBusinessId,
  partnerDashboardShape,
} from '@/modules/partners/service';
import { respData, respErr } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const supplier = await findPartnerByUserId(session.user.id);
    if (!supplier || !isPartnerCurrentlyActive(supplier)) {
      return respErr('partner access denied');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') || '50'))
    );
    const partnerId = partnerBusinessId(supplier);

    const [stats, credentialsTotal, credentials, orders] = await Promise.all([
      getPartnerCredentialStats(partnerId),
      getPartnerCredentialsCount({ partnerId, status }),
      getPartnerCredentials({ partnerId, status, page, limit: pageSize }),
      getPartnerOrders({ partnerId, limit: 10 }),
    ]);

    const products = listPricingProducts()
      .filter((item) => item.priceInCents > 0)
      .map((item) => ({
        productId: item.productId,
        name: item.productName || item.planName || item.productId,
        amount: item.priceInCents,
        currency: item.currency,
      }));

    return respData({
      partner: partnerDashboardShape(supplier),
      stats,
      credentials: {
        items: credentials,
        total: credentialsTotal,
        page,
        pageSize,
        status,
      },
      orders,
      products,
    });
  } catch (error: any) {
    return respErr(error.message || 'Load partner dashboard failed');
  }
}

export const Route = createFileRoute('/api/partner/dashboard')({
  server: {
    handlers: { GET },
  },
});
