import { createFileRoute } from '@tanstack/react-router';

import { m } from '@/paraglide/messages.js';

import { BusinessAnalyticsPanel } from './-business-analytics';

function AdminAnalyticsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{m['admin.analytics.title']()}</h1>
        <p className="text-muted-foreground">
          {m['admin.analytics.description']()}
        </p>
      </div>

      <BusinessAnalyticsPanel showHeader={false} />
    </div>
  );
}

export const Route = createFileRoute('/admin/analytics')({
  component: AdminAnalyticsPage,
});
