import { createFileRoute } from '@tanstack/react-router';
import { ChatHistoryPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/chat/history')({
  component: ChatHistoryPage,
});
