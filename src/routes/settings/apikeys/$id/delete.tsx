import { createFileRoute } from '@tanstack/react-router';
import { ApiKeyDeletePage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/settings/apikeys/$id/delete')({
  component: () => {
    const { id } = Route.useParams();
    return <ApiKeyDeletePage id={id} />;
  },
});
