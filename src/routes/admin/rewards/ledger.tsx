import { createFileRoute } from '@tanstack/react-router';

import { m } from '@/paraglide/messages.js';

import { AdminRewardRecordsPage } from './-reward-admin-page';

export const Route = createFileRoute('/admin/rewards/ledger')({
  component: RewardLedgerPage,
});

function RewardLedgerPage() {
  return (
    <AdminRewardRecordsPage
      kind="ledger"
      title={m['admin.rewards.ledger.title']()}
      description={m['admin.rewards.ledger.description']()}
    />
  );
}
