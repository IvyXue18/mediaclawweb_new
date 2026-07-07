import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/activity/feedbacks')({
  component: () => (
    <LegacyLinkPage
      title="Feedback Activity"
      description="Experience-feedback reward APIs are migrated; admin review pages are being restored in the next page batch."
      href="/welfare?entry=activity_feedbacks"
      label="Open welfare center"
    />
  ),
});
