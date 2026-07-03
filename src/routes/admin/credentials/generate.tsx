import { createFileRoute } from '@tanstack/react-router';
import { AdminCredentialGeneratePage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/credentials/generate')({
  component: AdminCredentialGeneratePage,
});
