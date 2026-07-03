import { createFileRoute } from '@tanstack/react-router';

import { AdminRewardRecordsPage } from './-reward-admin-page';

export const Route = createFileRoute('/admin/rewards/channel-survey')({
  component: ChannelSurveyRewardsPage,
});

function ChannelSurveyRewardsPage() {
  return (
    <AdminRewardRecordsPage
      kind="channel-survey"
      title="Channel Survey Rewards"
      description="Review channel survey submissions, reward credential issuance, duration, credits, and reward status."
    />
  );
}
