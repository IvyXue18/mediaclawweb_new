import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, ExternalLink, Loader2, Settings } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { ApiError, apiGet } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type BillingRetrieveSearch = {
  subscription_no?: string;
};

type BillingPortal = {
  billingUrl: string;
  subscriptionNo: string;
  paymentProvider: string;
};

function BillingRetrievePage() {
  const search = Route.useSearch();
  const subscriptionNo = search.subscription_no || '';

  const portalQuery = useQuery({
    queryKey: ['billing-retrieve', subscriptionNo],
    queryFn: () =>
      apiGet<BillingPortal>(
        `/api/user/subscriptions/billing?subscriptionNo=${encodeURIComponent(
          subscriptionNo
        )}`
      ),
    enabled: !!subscriptionNo,
    retry: false,
  });

  useEffect(() => {
    if (portalQuery.data?.billingUrl) {
      window.location.assign(portalQuery.data.billingUrl);
    }
  }, [portalQuery.data?.billingUrl]);

  const error =
    portalQuery.error instanceof ApiError
      ? portalQuery.error.message
      : portalQuery.error
        ? m['settings.billing.retrieve_page.failed']()
        : '';

  return (
    <div className="space-y-6 p-6" data-billing-retrieve-page>
      <Link
        href="/settings/billing"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        {m['settings.billing.cancel_page.back']()}
      </Link>

      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary rounded-md p-2">
          <Settings className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {m['settings.billing.retrieve_page.title']()}
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            {m['settings.billing.retrieve_page.description']()}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">
            {portalQuery.data?.paymentProvider ||
              m['settings.billing.provider']()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!subscriptionNo ? (
            <p className="text-destructive text-sm" role="alert">
              {m['settings.billing.retrieve_page.invalid_subscription']()}
            </p>
          ) : portalQuery.isPending ? (
            <p
              className="text-muted-foreground flex items-center gap-2 text-sm"
              role="status"
            >
              <Loader2 className="size-4 animate-spin" />
              {m['settings.billing.retrieve_page.loading']()}
            </p>
          ) : error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : portalQuery.data?.billingUrl ? (
            <div className="space-y-3" data-billing-retrieve-ready>
              <p className="text-muted-foreground text-sm">
                {portalQuery.data.subscriptionNo}
              </p>
              <Button
                render={
                  <a
                    href={portalQuery.data.billingUrl}
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-4" />
                    {m['settings.billing.retrieve_page.open_now']()}
                  </a>
                }
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/settings/billing/retrieve')({
  validateSearch: (search: Record<string, unknown>): BillingRetrieveSearch => ({
    subscription_no:
      typeof search.subscription_no === 'string'
        ? search.subscription_no
        : undefined,
  }),
  component: BillingRetrievePage,
});
