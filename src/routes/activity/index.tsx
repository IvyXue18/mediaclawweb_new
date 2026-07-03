import { createFileRoute } from '@tanstack/react-router';
import { ActivityLandingPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/activity/')({
  component: ActivityLandingPage,
});
