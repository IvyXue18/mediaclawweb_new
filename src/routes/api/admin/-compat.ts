import { getAuth } from '@/core/auth';
import { hasPermission } from '@/modules/rbac/service';

export async function requireAdmin(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error('Unauthorized');

  const isAdmin = await hasPermission(session.user.id, 'admin.*');
  if (!isAdmin) throw new Error('Forbidden');

  return session.user;
}

export function getPagination(request: Request, fallbackPageSize = 10) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('pageSize') || `${fallbackPageSize}`))
  );

  return { page, pageSize, searchParams };
}
