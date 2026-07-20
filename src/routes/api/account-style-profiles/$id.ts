import { createFileRoute } from '@tanstack/react-router';
import { requireUser } from '@/routes/api/user/-compat';

import { getAccountStyleReportDetail } from '@/modules/account-style/service';
import { respData, respErr } from '@/lib/resp';

async function GET({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    const user = await requireUser(request);
    const report = await getAccountStyleReportDetail({
      id: params.id,
      userId: user.id,
    });
    if (!report) return respErr('Account analysis report not found');
    return respData(report);
  } catch (error: any) {
    return respErr(error.message || 'Failed to load account analysis report');
  }
}

export const Route = createFileRoute('/api/account-style-profiles/$id')({
  server: { handlers: { GET } },
});
