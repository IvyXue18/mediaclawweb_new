import { createFileRoute } from '@tanstack/react-router';

import { AdminRewardRecordsPage } from './-reward-admin-page';

export const Route = createFileRoute('/admin/rewards/experience-feedback')({
  component: ExperienceFeedbackRewardsPage,
});

function ExperienceFeedbackRewardsPage() {
  return (
    <AdminRewardRecordsPage
      kind="experience-feedback"
      title="Experience Feedback Rewards"
      description="Review plugin-verified experience feedback, ratings, comments, expected features, and reward status."
    />
  );
}
