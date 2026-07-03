import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/activity/monitoring/$transactionNo')({
  component: () => {
    const { transactionNo } = Route.useParams();
    return (
      <LegacyLinkPage
        title="Monitoring Detail"
        description={`Monitoring transaction ${transactionNo} is recognized by the migrated route tree.`}
        href="/activity/monitoring"
        label="Back to monitoring"
      />
    );
  },
});
