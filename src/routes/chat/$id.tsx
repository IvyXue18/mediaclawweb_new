import { createFileRoute } from '@tanstack/react-router';
import { ChatDetailPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/chat/$id')({
  component: () => {
    const { id } = Route.useParams();
    return <ChatDetailPage id={id} />;
  },
});
