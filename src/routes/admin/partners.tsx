import { useEffect, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Download, MoreHorizontal, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

import { apiGet, apiPatch, apiPost, type PageResult } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
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

type PartnerRow = {
  id: string;
  partnerCode: string;
  name: string;
  type: string;
  status: string;
  ownerEmail?: string | null;
  variantId?: string | null;
  contractStatus: string;
  seatLimit: number;
  usedSeats: number;
  notes?: string | null;
  createdAt: string;
};

const PAGE_SIZE = 10;

function statusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'active') return 'default';
  if (status === 'paused') return 'secondary';
  return 'destructive';
}

function formatPartnerStatus(status: string) {
  const labels: Record<string, string> = {
    active: m['admin.partners.status.active'](),
    paused: m['admin.partners.status.paused'](),
    disabled: m['admin.partners.status.disabled'](),
  };
  return labels[status] || status || '-';
}

function formatPartnerType(type: string) {
  const labels: Record<string, string> = {
    supplier: m['admin.partners.type.supplier'](),
    channel: m['admin.partners.type.channel'](),
    white_label: m['admin.partners.type.white_label'](),
  };
  return labels[type] || type || '-';
}

function formatContractStatus(status: string) {
  const labels: Record<string, string> = {
    draft: m['admin.partners.contract.draft'](),
    signed: m['admin.partners.contract.signed'](),
    expired: m['admin.partners.contract.expired'](),
  };
  return labels[status] || status || '-';
}

function AdminPartnersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'supplier',
    ownerEmail: '',
    variantId: '',
    contractStatus: 'draft',
    seatLimit: '0',
    notes: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch]);

  const query = useQuery({
    queryKey: ['admin-partners', page, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      return apiGet<PageResult<PartnerRow>>(`/api/admin/partners?${params}`);
    },
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost('/api/admin/partners', {
        ...form,
        seatLimit: Number(form.seatLimit || 0),
      }),
    onSuccess: () => {
      toast.success(m['admin.partners.messages.created']());
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: {
      id: string;
      status?: string;
      contractStatus?: string;
    }) => apiPatch('/api/admin/partners', vars),
    onSuccess: () => {
      toast.success(m['admin.partners.messages.updated']());
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: Column<PartnerRow>[] = [
    {
      header: m['admin.partners.columns.partner'](),
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-muted-foreground font-mono text-xs">
            {row.partnerCode}
          </p>
        </div>
      ),
    },
    {
      header: m['admin.partners.columns.owner'](),
      cell: (row) => row.ownerEmail || '-',
    },
    {
      header: m['admin.partners.columns.type'](),
      cell: (row) => formatPartnerType(row.type),
    },
    {
      header: m['admin.partners.columns.contract_status'](),
      cell: (row) => (
        <Badge variant="secondary">
          {formatContractStatus(row.contractStatus)}
        </Badge>
      ),
    },
    {
      header: m['admin.partners.columns.seats'](),
      cell: (row) => (
        <span className="tabular-nums">
          {row.usedSeats}/{row.seatLimit || '∞'}
        </span>
      ),
    },
    {
      header: m['admin.partners.columns.status'](),
      cell: (row) => (
        <Badge variant={statusVariant(row.status)}>
          {formatPartnerStatus(row.status)}
        </Badge>
      ),
    },
    {
      header: '',
      className: 'w-[96px]',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={m['admin.partners.actions.export_credentials']()}
            onClick={() => {
              window.location.href = `/api/partner/credentials/export?partnerId=${encodeURIComponent(row.id)}`;
            }}
          >
            <Download className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {['active', 'paused', 'disabled'].map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => updateMutation.mutate({ id: row.id, status })}
                >
                  {m['admin.partners.actions.set_status']({
                    status: formatPartnerStatus(status),
                  })}
                </DropdownMenuItem>
              ))}
              {['draft', 'signed', 'expired'].map((contractStatus) => (
                <DropdownMenuItem
                  key={contractStatus}
                  onClick={() =>
                    updateMutation.mutate({ id: row.id, contractStatus })
                  }
                >
                  {m['admin.partners.actions.set_contract']({
                    status: formatContractStatus(contractStatus),
                  })}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{m['admin.partners.title']()}</h1>
          <p className="text-muted-foreground">
            {m['admin.partners.description']()}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          {m['admin.partners.create_button']()}
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
            searchPlaceholder={m['admin.partners.search_placeholder']()}
            onRefresh={() => query.refetch()}
            loading={query.isFetching}
            emptyText={m['admin.partners.empty']()}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-5" />
              {m['admin.partners.create_title']()}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="partner-name">
                {m['admin.partners.fields.name']()}
              </Label>
              <Input
                id="partner-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="partner-type">
                  {m['admin.partners.fields.type']()}
                </Label>
                <Input
                  id="partner-type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="partner-owner">
                  {m['admin.partners.fields.owner_email']()}
                </Label>
                <Input
                  id="partner-owner"
                  value={form.ownerEmail}
                  onChange={(e) =>
                    setForm({ ...form, ownerEmail: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="variant-id">
                  {m['admin.partners.fields.variant_id']()}
                </Label>
                <Input
                  id="variant-id"
                  value={form.variantId}
                  onChange={(e) =>
                    setForm({ ...form, variantId: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="seat-limit">
                  {m['admin.partners.fields.seat_limit']()}
                </Label>
                <Input
                  id="seat-limit"
                  type="number"
                  value={form.seatLimit}
                  onChange={(e) =>
                    setForm({ ...form, seatLimit: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="partner-notes">
                {m['admin.partners.fields.notes']()}
              </Label>
              <Input
                id="partner-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {m['admin.partners.cancel']()}
            </Button>
            <Button
              disabled={!form.name.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {m['admin.partners.create_confirm']()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Route = createFileRoute('/admin/partners')({
  component: AdminPartnersPage,
});
