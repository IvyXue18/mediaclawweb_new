import { createFileRoute } from '@tanstack/react-router';
import { like, or } from 'drizzle-orm';

import { db } from '@/core/db';
import { user } from '@/config/db/schema';
import { respData, respErr } from '@/lib/resp';

import { requireAdmin } from '../-compat';

async function GET({ request }: { request: Request }) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) return respData([]);

    const results = await db()
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(user)
      .where(or(like(user.email, `%${query}%`), like(user.name, `%${query}%`)))
      .limit(10);

    return respData(results);
  } catch (error: any) {
    return respErr(error.message || 'Search failed');
  }
}

export const Route = createFileRoute('/api/admin/users/search')({
  server: { handlers: { GET } },
});
