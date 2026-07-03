import { createFileRoute } from '@tanstack/react-router';
import { AdminCredentialRechargePage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/credentials/$id/recharge')({
  component: () => {
    const { id } = Route.useParams();
    return <AdminCredentialRechargePage id={id} />;
  },
});
