import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/admin/settings/$tab')({
  component: () => {
    const { tab } = Route.useParams();
    return (
      <LegacyLinkPage
        title={m['admin.legacy.settings_tab.title']({ tab })}
        description={m['admin.legacy.settings_tab.description']()}
        href="/admin/settings"
        label={m['admin.legacy.settings.open']()}
      />
    );
  },
});
