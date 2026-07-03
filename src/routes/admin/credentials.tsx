import { useEffect, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { KeyRound, MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { apiGet, apiPatch, apiPost, type PageResult } from '@/lib/api-client';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CredentialRow = {
  id: string;
  code: string;
  ownerUserId?: string | null;
  ownerEmail?: string | null;
  sourceOrderNo?: string | null;
  planCode?: string | null;
  durationPreset?: string | null;
  maxBindings: number;
  expiresAt?: string | null;
  status: string;
  partnerId?: string | null;
  variantId?: string | null;
  notes?: string | null;
  createdAt: string;
};

const PAGE_SIZE = 10;

function statusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'active') return 'default';
  if (status === 'frozen' || status === 'revoked') return 'destructive';
  return 'secondary';
}

function AdminCredentialsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    ownerEmail: '',
    planCode: 'formal',
    durationPreset: 'monthly',
    maxBindings: '1',
    totalCredits: '0',
    partnerId: '',
    variantId: '',
    notes: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch]);

  const query = useQuery({
    queryKey: ['admin-credentials', page, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      return apiGet<PageResult<CredentialRow>>(
        `/api/admin/credentials?${params}`
      );
    },
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost('/api/admin/credentials', {
        ...form,
        maxBindings: Number(form.maxBindings || 1),
        totalCredits: Number(form.totalCredits || 0),
      }),
    onSuccess: () => {
      toast.success('Activation code created');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-credentials'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: string }) =>
      apiPatch('/api/admin/credentials', vars),
    onSuccess: () => {
      toast.success('Activation code updated');
      queryClient.invalidateQueries({ queryKey: ['admin-credentials'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: Column<CredentialRow>[] = [
    {
      header: 'Code',
      cell: (row) => <span className="font-mono text-xs">{row.code}</span>,
    },
    {
      header: 'Owner',
      cell: (row) => row.ownerEmail || row.ownerUserId || 'Unclaimed',
    },
    {
      header: 'Plan',
      cell: (row) => (
        <span>
          {row.planCode || '-'}
          <span className="text-muted-foreground ml-1">
            {row.durationPreset || ''}
          </span>
        </span>
      ),
    },
    {
      header: 'Partner',
      cell: (row) => row.partnerId || '-',
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
      ),
    },
    {
      header: 'Expires',
      cell: (row) =>
        row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : '-',
    },
    {
      header: '',
      className: 'w-[64px]',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {['active', 'frozen', 'revoked'].map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => statusMutation.mutate({ id: row.id, status })}
              >
                Mark {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activation Codes</h1>
          <p className="text-muted-foreground">
            Generate, inspect, freeze, and attribute MediaClaw activation codes.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New code
        </Button>
      </div>

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={query.data?.items ?? []}
            total={query.data?.total ?? 0}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            rowKey={(row) => row.id}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search code, order, or partner"
            onRefresh={() => query.refetch()}
            loading={query.isFetching}
            emptyText="No activation codes yet"
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5" />
              New activation code
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Leave blank to auto-generate"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ownerEmail">Owner email</Label>
                <Input
                  id="ownerEmail"
                  value={form.ownerEmail}
                  onChange={(e) =>
                    setForm({ ...form, ownerEmail: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="planCode">Plan</Label>
                <Input
                  id="planCode"
                  value={form.planCode}
                  onChange={(e) =>
                    setForm({ ...form, planCode: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="durationPreset">Duration</Label>
                <Input
                  id="durationPreset"
                  value={form.durationPreset}
                  onChange={(e) =>
                    setForm({ ...form, durationPreset: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxBindings">Seats</Label>
                <Input
                  id="maxBindings"
                  type="number"
                  value={form.maxBindings}
                  onChange={(e) =>
                    setForm({ ...form, maxBindings: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="totalCredits">Credit pool</Label>
                <Input
                  id="totalCredits"
                  type="number"
                  value={form.totalCredits}
                  onChange={(e) =>
                    setForm({ ...form, totalCredits: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="partnerId">Partner ID</Label>
                <Input
                  id="partnerId"
                  value={form.partnerId}
                  onChange={(e) =>
                    setForm({ ...form, partnerId: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Route = createFileRoute('/admin/credentials')({
  component: AdminCredentialsPage,
});
