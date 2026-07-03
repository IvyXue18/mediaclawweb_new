import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/users/$id/reset-password')({
  component: () => (
    <LegacyLinkPage
      title="Reset User Password"
      description="Password reset is preserved as a route; exact old admin reset workflow still needs a dedicated better-auth adapter."
      href="/admin/users"
      label="Open users"
    />
  ),
});
