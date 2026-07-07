import { createFileRoute } from '@tanstack/react-router';

import { m } from '@/paraglide/messages.js';

import { AdminRewardRecordsPage } from './-reward-admin-page';

export const Route = createFileRoute('/admin/rewards/channel-survey')({
  component: ChannelSurveyRewardsPage,
});

function ChannelSurveyRewardsPage() {
  return (
    <AdminRewardRecordsPage
      kind="channel-survey"
      title={m['admin.rewards.channel_survey.title']()}
      description={m['admin.rewards.channel_survey.description']()}
    />
  );
}
