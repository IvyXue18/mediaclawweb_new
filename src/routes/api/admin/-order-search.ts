import { like, or, type SQL } from 'drizzle-orm';

import { order, user } from '@/config/db/schema';

export function buildAdminOrderSearchCondition(
  search?: string | null
): SQL | undefined {
  const normalized = search?.trim().slice(0, 120);
  if (!normalized) return undefined;

  const term = `%${normalized}%`;
  return or(
    like(order.orderNo, term),
    like(order.userEmail, term),
    like(user.email, term),
    like(user.name, term)
  );
}
