import { useMemo, useState, useTransition } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createFileRoute,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import { Download, Loader2, RefreshCw, Save, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { apiGet, apiPatch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type ProductOption = {
  productId: string;
  name: string;
  amount: number;
  currency: string;
};

type PartnerCredential = {
  id: string;
  code: string;
  status: string;
  activationStatus: 'unused' | 'activated' | 'expired' | 'disabled';
  planCode?: string | null;
  partnerId?: string | null;
  variantId?: string | null;
  sourceOrderNo?: string | null;
  assignmentNote?: string | null;
  activatedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
};

type PartnerOrder = {
  orderNo: string;
  productName?: string | null;
  productId?: string | null;
  status: string;
  amount: number;
  paymentAmount?: number | null;
  currency: string;
  seatCount?: number | null;
  createdAt: string;
};

type PartnerDashboard = {
  partner: {
    partnerId: string;
    partnerCode: string;
    name: string;
    defaultVariantId: string;
  };
  stats: Record<
    'total' | 'unused' | 'activated' | 'expired' | 'disabled',
    number
  >;
  credentials: {
    items: PartnerCredential[];
    total: number;
    page: number;
    pageSize: number;
    status: string;
  };
  orders: PartnerOrder[];
  products: ProductOption[];
};

const PAGE_SIZE = 50;
const statusTabs = [
  { value: 'all', label: '全部' },
  { value: 'unused', label: '未使用' },
  { value: 'activated', label: '已激活' },
  { value: 'expired', label: '已过期' },
  { value: 'disabled', label: '已禁用' },
];

export const Route = createFileRoute('/partner')({
  head: () => ({
    meta: [
      { title: `伙伴后台 | ${envConfigs.app_name}` },
      {
        name: 'description',
        content:
          'MediaClaw 伙伴后台：批量购买席位、查看订单、导出激活码并维护分配备注。',
      },
    ],
  }),
  component: PartnerPage,
});

function money(amount: number, currency: string) {
  return `${String(currency || 'USD').toUpperCase()} ${(
    Number(amount || 0) / 100
  ).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status: string) {
  return (
    {
      unused: '未使用',
      activated: '已激活',
      expired: '已过期',
      disabled: '已禁用',
    }[status] || status
  );
}

function statusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'activated') return 'default';
  if (status === 'unused') return 'secondary';
  if (status === 'expired' || status === 'disabled') return 'destructive';
  return 'outline';
}

function PartnerPage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const normalizedPathname = pathname.replace(/^\/[a-z]{2}(?=\/)/, '');
  if (normalizedPathname !== '/partner' && normalizedPathname !== '/partner/') {
    return <Outlet />;
  }

  return <PartnerDashboardPage />;
}

function PartnerDashboardPage() {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['partner-dashboard', status, page],
    queryFn: () =>
      apiGet<PartnerDashboard>(
        `/api/partner/dashboard?status=${encodeURIComponent(status)}&page=${page}&pageSize=${PAGE_SIZE}`
      ),
    placeholderData: keepPreviousData,
  });

  const data = query.data;
  const isAccessError =
    query.error instanceof Error &&
    ['Unauthorized', 'partner access denied'].some((message) =>
      query.error?.message.includes(message)
    );

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container space-y-8 pt-28 pb-14 md:pt-32">
        {query.isLoading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : isAccessError ? (
          <PartnerAccessState />
        ) : query.error ? (
          <Card>
            <CardHeader>
              <CardTitle>伙伴后台暂时无法加载</CardTitle>
              <CardDescription>{query.error.message}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => query.refetch()}>
                <RefreshCw className="size-4" />
                重新加载
              </Button>
            </CardContent>
          </Card>
        ) : data ? (
          <>
            <section className="flex flex-wrap items-end gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-sm">
                  {data.partner.partnerId} / {data.partner.defaultVariantId}
                </p>
                <h1 className="text-3xl font-semibold tracking-normal">
                  伙伴后台
                </h1>
              </div>
              <a
                href={`/api/partner/credentials/export?status=${encodeURIComponent(status)}`}
                className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}
              >
                <Download className="size-4" />
                导出激活码
              </a>
            </section>

            <section className="grid gap-4 md:grid-cols-5">
              {statusTabs.map((item) => (
                <Card key={item.value}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm font-medium">
                      {item.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold tabular-nums">
                      {item.value === 'all'
                        ? data.stats.total
                        : data.stats[item.value as keyof typeof data.stats]}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[22rem_1fr]">
              <PartnerPurchaseCard
                products={data.products}
                partnerId={data.partner.partnerId}
              />
              <RecentOrdersCard orders={data.orders} />
            </section>

            <Card>
              <CardHeader className="gap-4">
                <div>
                  <CardTitle>激活码池</CardTitle>
                  <CardDescription>
                    按激活状态查看、导出并维护交付备注。
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusTabs.map((item) => (
                    <Button
                      key={item.value}
                      type="button"
                      size="sm"
                      variant={status === item.value ? 'default' : 'outline'}
                      onClick={() => {
                        setStatus(item.value);
                        setPage(1);
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <CredentialsTable
                  credentials={data.credentials.items}
                  total={data.credentials.total}
                  page={page}
                  onPageChange={setPage}
                  onRefresh={() => query.refetch()}
                  loading={query.isFetching}
                />
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

function PartnerAccessState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>当前账号还没有可访问的伙伴后台</CardTitle>
        <CardDescription>
          登录后需要由管理员绑定有效伙伴记录，才能查看激活码池、订单和导出数据。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Link href="/sign-in" className={buttonVariants()}>
          登录账号
        </Link>
        <Link
          href="/settings/profile"
          className={buttonVariants({ variant: 'outline' })}
        >
          查看个人资料
        </Link>
      </CardContent>
    </Card>
  );
}

function PartnerPurchaseCard({
  products,
  partnerId,
}: {
  products: ProductOption[];
  partnerId: string;
}) {
  const [productId, setProductId] = useState(products[0]?.productId || '');
  const [seats, setSeats] = useState(10);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const selected = useMemo(
    () => products.find((item) => item.productId === productId),
    [productId, products]
  );

  function submit() {
    setError('');
    startTransition(async () => {
      try {
        const resp = await fetch('/api/payment/checkout', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            product_id: productId,
            currency: selected?.currency || 'USD',
            partner_id: partnerId,
            seats,
            metadata: { source: 'partner_dashboard' },
          }),
        });
        const payload = await resp.json();
        if (payload.code !== 0) {
          throw new Error(payload.message || 'checkout failed');
        }
        const checkoutUrl =
          payload.data?.checkoutUrl || payload.data?.checkout_url;
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
          return;
        }
        window.location.href = '/partner';
      } catch (err: any) {
        setError(err?.message || 'checkout failed');
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="size-5" />
          批量购买席位
        </CardTitle>
        <CardDescription>
          为当前伙伴批量购买授权席位，支付成功后自动进入激活码池。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="partner-product">产品</Label>
          <select
            id="partner-product"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            {products.map((product) => (
              <option key={product.productId} value={product.productId}>
                {product.name} · {money(product.amount, product.currency)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner-seats">席位数量</Label>
          <Input
            id="partner-seats"
            type="number"
            min="1"
            max="500"
            value={seats}
            onChange={(event) => setSeats(Number(event.target.value || 1))}
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button
          type="button"
          className="w-full"
          disabled={!productId || isPending}
          onClick={submit}
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          去支付
        </Button>
      </CardContent>
    </Card>
  );
}

function RecentOrdersCard({ orders }: { orders: PartnerOrder[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>最近订单</CardTitle>
        <CardDescription>
          展示当前伙伴最近的批量购买与支付状态。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>产品</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-8 text-center"
                  >
                    暂无订单
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.orderNo}>
                    <TableCell className="font-mono text-xs">
                      {order.orderNo}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.productName || order.productId}</span>
                        <span className="text-muted-foreground text-xs">
                          {order.seatCount || 1} 席
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {money(
                        order.paymentAmount || order.amount,
                        order.currency
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === 'paid' ? 'default' : 'secondary'
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function CredentialsTable({
  credentials,
  total,
  page,
  onPageChange,
  onRefresh,
  loading,
}: {
  credentials: PartnerCredential[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="刷新"
          disabled={loading}
          onClick={onRefresh}
        >
          <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>激活码</TableHead>
              <TableHead>套餐</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>过期时间</TableHead>
              <TableHead>激活时间</TableHead>
              <TableHead className="min-w-[260px]">分配备注</TableHead>
              <TableHead>创建时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credentials.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  暂无激活码
                </TableCell>
              </TableRow>
            ) : (
              credentials.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">
                    {item.code}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {item.planCode || '-'}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {item.variantId || 'official'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.activationStatus)}>
                      {statusLabel(item.activationStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(item.expiresAt)}</TableCell>
                  <TableCell>{formatDate(item.activatedAt)}</TableCell>
                  <TableCell>
                    <CredentialNoteForm credential={item} />
                  </TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">共 {total} 条</p>
        {total > PAGE_SIZE && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              下一页
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CredentialNoteForm({ credential }: { credential: PartnerCredential }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(credential.assignmentNote || '');
  const mutation = useMutation({
    mutationFn: () =>
      apiPatch(`/api/partner/credentials/${credential.id}`, {
        assignmentNote: value,
      }),
    onSuccess: () => {
      toast.success('备注已保存');
      queryClient.invalidateQueries({ queryKey: ['partner-dashboard'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex gap-2">
      <Input
        value={value}
        placeholder="客户名 / 批次 / 交付说明"
        className="h-8"
        onChange={(event) => setValue(event.target.value)}
      />
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="size-8 shrink-0"
        disabled={mutation.isPending}
        aria-label="保存备注"
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
      </Button>
    </div>
  );
}
