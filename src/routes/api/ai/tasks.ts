import { createFileRoute } from '@tanstack/react-router';
import { getPagination, requireUser } from '@/routes/api/user/-compat';

import { getTasks, getTasksCount } from '@/modules/ai-tasks/service';
import { respErr, respPage } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  try {
    const user = await requireUser(request);
    const { page, pageSize, searchParams } = getPagination(request, 20);
    const mediaType = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const provider = searchParams.get('provider') || undefined;
    const search = searchParams.get('search') || undefined;

    const params = {
      userId: user.id,
      mediaType,
      status,
      provider,
      search,
    };

    const [items, total] = await Promise.all([
      getTasks({ ...params, page, limit: pageSize }),
      getTasksCount(params),
    ]);

    return respPage(items, total);
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

export const Route = createFileRoute('/api/ai/tasks')({
  server: { handlers: { GET } },
});
