import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/admin/no-permission')({
  component: () => (
    <LegacyLinkPage
      title={m['admin.legacy.no_permission.title']()}
      description={m['admin.legacy.no_permission.description']()}
      href="/"
      label={m['common.systems.home']()}
    />
  ),
});
