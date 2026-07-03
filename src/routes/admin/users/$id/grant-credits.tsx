import { createFileRoute } from '@tanstack/react-router';
import { AdminGrantCreditsPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/users/$id/grant-credits')({
  component: () => {
    const { id } = Route.useParams();
    return <AdminGrantCreditsPage userId={id} />;
  },
});
