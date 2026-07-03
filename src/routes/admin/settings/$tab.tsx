import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/settings/$tab')({
  component: () => {
    const { tab } = Route.useParams();
    return (
      <LegacyLinkPage
        title={`Admin Settings: ${tab}`}
        description="Tabbed admin settings now render inside the migrated settings page."
        href="/admin/settings"
        label="Open admin settings"
      />
    );
  },
});
