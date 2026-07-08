import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getUserCredentialBalance } from '@/modules/credentials/service';
import { getBalance, getHistory } from '@/modules/credits/service';
import { respData, respErr } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return respErr('Unauthorized');
    }

    const [walletBalance, credentialBalance, history] = await Promise.all([
      getBalance(session.user.id),
      getUserCredentialBalance(session.user.id),
      getHistory(session.user.id),
    ]);

    return respData({
      // Total spendable credits: site wallet grants + credits remaining on
      // the activation codes bound to this account.
      balance: walletBalance + credentialBalance,
      walletBalance,
      credentialBalance,
      history,
    });
  } catch (error: any) {
    return respErr(error.message || 'Failed to get credits');
  }
}

export const Route = createFileRoute('/api/credits')({
  server: {
    handlers: { GET },
  },
});
