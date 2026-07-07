import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { BadgeCheck, CreditCard, KeyRound } from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { apiGet, type PageResult } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function DashboardPage() {
  const { data: session } = useSession();

  const { data: creditsData } = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiGet<{ balance: number }>('/api/credits'),
  });
  const { data: credentialsData } = useQuery({
    queryKey: ['settings-overview-credentials'],
    queryFn: () =>
      apiGet<PageResult<{ id: string }>>(
        '/api/user/credentials?page=1&pageSize=1'
      ),
  });
  const { data: activeCredentialsData } = useQuery({
    queryKey: ['settings-overview-active-credentials'],
    queryFn: () =>
      apiGet<PageResult<{ id: string }>>(
        '/api/user/credentials?page=1&pageSize=1&status=active'
      ),
  });

  const credits = creditsData?.balance ?? null;
  const credentials = credentialsData?.total ?? null;
  const activeCredentials = activeCredentialsData?.total ?? null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {m['settings.title']()}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {m['settings.welcome']({
            name: session?.user?.name || session?.user?.email || '',
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {m['settings.overview.entitlement']()}
            </CardTitle>
            <BadgeCheck className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCredentials ?? '—'}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {m['settings.overview.entitlement_description']()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {m['settings.credits.title']()}
            </CardTitle>
            <CreditCard className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credits ?? '—'}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {m['settings.credits.description']()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {m['settings.credentials.title']()}
            </CardTitle>
            <KeyRound className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credentials ?? '—'}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {m['settings.overview.credentials_description']()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/settings/')({
  component: DashboardPage,
});
