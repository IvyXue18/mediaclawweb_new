import { createFileRoute } from '@tanstack/react-router';
import { and, desc, eq, isNull } from 'drizzle-orm';

import { getAuth } from '@/core/auth';
import { db } from '@/core/db';
import { credential, order } from '@/config/db/schema';
import { getStarterChannelSurveyTask } from '@/modules/benefits/service';
import { STARTER_PRODUCT_ID } from '@/modules/starter/service';
import { respData, respErr } from '@/lib/resp';

/**
 * GET /api/starter/claim-info?order_no=xxx
 *
 * 支付成功页（/welfare/claim）轮询此接口：返回 9 元卡订单状态与已发放的
 * 激活码。发码由支付回调/webhook 幂等完成，此接口只读。
 */
async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return respErr('Unauthorized');
    }

    const url = new URL(request.url);
    const orderNo = String(url.searchParams.get('order_no') || '').trim();

    let orderRow: typeof order.$inferSelect | null = null;
    if (orderNo) {
      const [row] = await db()
        .select()
        .from(order)
        .where(and(eq(order.orderNo, orderNo), isNull(order.deletedAt)))
        .limit(1);
      orderRow = row ?? null;
    } else {
      // 兜底：不带 order_no 时取该用户最近一笔 9 元卡订单（用户中途关页后重进）。
      const [row] = await db()
        .select()
        .from(order)
        .where(
          and(
            eq(order.userId, session.user.id),
            eq(order.productId, STARTER_PRODUCT_ID),
            isNull(order.deletedAt)
          )
        )
        .orderBy(desc(order.createdAt))
        .limit(1);
      orderRow = row ?? null;
    }

    if (!orderRow || orderRow.userId !== session.user.id) {
      return respErr('order not found');
    }
    if (orderRow.productId !== STARTER_PRODUCT_ID) {
      return respErr('not a starter order');
    }

    let credentialRow: {
      id: string;
      code: string;
      expiresAt: Date | null;
      status: string | null;
    } | null = null;
    if (orderRow.status === 'paid') {
      const [row] = await db()
        .select({
          id: credential.id,
          code: credential.code,
          expiresAt: credential.expiresAt,
          status: credential.status,
        })
        .from(credential)
        .where(
          and(
            eq(credential.sourceOrderNo, orderRow.orderNo),
            isNull(credential.deletedAt)
          )
        )
        .limit(1);
      credentialRow = row ?? null;
    }

    const surveyTask = credentialRow
      ? await getStarterChannelSurveyTask(
          session.user.id,
          credentialRow.id
        ).catch(() => null)
      : null;

    return respData({
      orderNo: orderRow.orderNo,
      orderStatus: orderRow.status,
      checkoutUrl:
        ['created', 'pending'].includes(orderRow.status) && orderRow.checkoutUrl
          ? orderRow.checkoutUrl
          : null,
      credentialSyncStatus: orderRow.credentialSyncStatus,
      credential: credentialRow
        ? {
            credentialId: credentialRow.id,
            code: credentialRow.code,
            expiresAt: credentialRow.expiresAt
              ? credentialRow.expiresAt.toISOString()
              : null,
            status: credentialRow.status,
          }
        : null,
      surveyCompleted: surveyTask?.status === 'completed',
    });
  } catch (error: any) {
    console.error('starter claim-info error:', error);
    return respErr(error?.message || 'starter claim-info failed');
  }
}

export const Route = createFileRoute('/api/starter/claim-info')({
  server: {
    handlers: { GET },
  },
});
