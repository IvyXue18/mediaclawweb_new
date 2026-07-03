import { createFileRoute } from '@tanstack/react-router';
import { ChatHistoryPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/activity/chats')({
  component: ChatHistoryPage,
});
