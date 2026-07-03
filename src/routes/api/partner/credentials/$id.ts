import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  findPartnerByUserId,
  isPartnerCurrentlyActive,
  partnerBusinessId,
  updatePartnerCredentialAssignmentNote,
} from '@/modules/partners/service';
import { respData, respErr } from '@/lib/resp';

async function PATCH({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const supplier = await findPartnerByUserId(session.user.id);
    if (!supplier || !isPartnerCurrentlyActive(supplier)) {
      return respErr('partner access denied');
    }

    const body = await request.json().catch(() => ({}));
    const updated = await updatePartnerCredentialAssignmentNote({
      partnerId: partnerBusinessId(supplier),
      credentialId: params.id,
      assignmentNote: String(body.assignmentNote || body.assignment_note || ''),
    });
    if (!updated) return respErr('credential not found');

    return respData(updated);
  } catch (error: any) {
    return respErr(error.message || 'Update credential failed');
  }
}

export const Route = createFileRoute('/api/partner/credentials/$id')({
  server: {
    handlers: { PATCH },
  },
});
