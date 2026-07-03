import { createFileRoute } from '@tanstack/react-router';

import { AdminRewardRecordsPage } from './-reward-admin-page';

export const Route = createFileRoute('/admin/rewards/ledger')({
  component: RewardLedgerPage,
});

function RewardLedgerPage() {
  return (
    <AdminRewardRecordsPage
      kind="ledger"
      title="Reward Ledger"
      description="Audit every welfare reward issuance attempt, action, credential, granted days, credits, status, and error message."
    />
  );
}
