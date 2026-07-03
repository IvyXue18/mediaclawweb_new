import { createFileRoute } from '@tanstack/react-router';
import { ApiKeyCreatePage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/settings/apikeys/create')({
  component: ApiKeyCreatePage,
});
