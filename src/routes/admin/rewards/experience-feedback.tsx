import { createFileRoute } from '@tanstack/react-router';

import { m } from '@/paraglide/messages.js';

import { AdminRewardRecordsPage } from './-reward-admin-page';

export const Route = createFileRoute('/admin/rewards/experience-feedback')({
  component: ExperienceFeedbackRewardsPage,
});

function ExperienceFeedbackRewardsPage() {
  return (
    <AdminRewardRecordsPage
      kind="experience-feedback"
      title={m['admin.rewards.experience_feedback.title']()}
      description={m['admin.rewards.experience_feedback.description']()}
    />
  );
}
