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
      toast.success('Partner created');
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
      toast.success('Partner updated');
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: Column<PartnerRow>[] = [
    {
      header: 'Partner',
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
      header: 'Owner',
      cell: (row) => row.ownerEmail || '-',
    },
    {
      header: 'Type',
      cell: (row) => row.type,
    },
    {
      header: 'Contract',
      cell: (row) => <Badge variant="secondary">{row.contractStatus}</Badge>,
    },
    {
      header: 'Seats',
      cell: (row) => (
        <span className="tabular-nums">
          {row.usedSeats}/{row.seatLimit || '∞'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
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
            aria-label="Export credentials"
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
                  Mark {status}
                </DropdownMenuItem>
              ))}
              {['draft', 'signed', 'expired'].map((contractStatus) => (
                <DropdownMenuItem
                  key={contractStatus}
                  onClick={() =>
                    updateMutation.mutate({ id: row.id, contractStatus })
                  }
                >
                  Contract {contractStatus}
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
          <h1 className="text-2xl font-bold">Partners</h1>
          <p className="text-muted-foreground">
            Manage supplier, channel, and white-label attribution on one
            backend.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New partner
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
            searchPlaceholder="Search partner, code, or owner"
            onRefresh={() => query.refetch()}
            loading={query.isFetching}
            emptyText="No partners yet"
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-5" />
              New partner
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="partner-name">Name</Label>
              <Input
                id="partner-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="partner-type">Type</Label>
                <Input
                  id="partner-type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="partner-owner">Owner email</Label>
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
                <Label htmlFor="variant-id">Variant ID</Label>
                <Input
                  id="variant-id"
                  value={form.variantId}
                  onChange={(e) =>
                    setForm({ ...form, variantId: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="seat-limit">Seat limit</Label>
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
              <Label htmlFor="partner-notes">Notes</Label>
              <Input
                id="partner-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!form.name.trim() || createMutation.isPending}
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

export const Route = createFileRoute('/admin/partners')({
  component: AdminPartnersPage,
});
