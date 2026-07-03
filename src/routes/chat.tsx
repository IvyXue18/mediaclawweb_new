import { createFileRoute } from '@tanstack/react-router';
import { ChatStartPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/chat')({
  component: ChatStartPage,
});
