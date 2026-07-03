import { useMemo, useState, useTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Loader2, ShoppingCart } from 'lucide-react';

import { envConfigs } from '@/config';
import { apiGet } from '@/lib/api-client';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ProductOption = {
  productId: string;
  name: string;
  amount: number;
  currency: string;
};

type PartnerChannel = {
  partner: {
    partnerId: string;
    name: string;
    defaultVariantId: string;
  };
  products: ProductOption[];
};

export const Route = createFileRoute('/partner/$channelCode/buy')({
  head: ({ params }) => ({
    meta: [
      { title: `伙伴购买入口 | ${envConfigs.app_name}` },
      {
        name: 'description',
        content: `${params.channelCode} 的 MediaClaw 伙伴购买入口。`,
      },
    ],
  }),
  component: PartnerBuyPage,
});

function money(amount: number, currency: string) {
  return `${String(currency || 'USD').toUpperCase()} ${(
    Number(amount || 0) / 100
  ).toFixed(2)}`;
}

function PartnerBuyPage() {
  const { channelCode } = Route.useParams();
  const query = useQuery({
    queryKey: ['partner-channel', channelCode],
    queryFn: () =>
      apiGet<PartnerChannel>(
        `/api/partner/channel/${encodeURIComponent(channelCode)}`
      ),
  });

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container max-w-3xl space-y-8 pt-28 pb-14 md:pt-32">
        {query.isLoading ? (
          <div className="flex min-h-[42vh] items-center justify-center">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : query.error ? (
          <Card>
            <CardHeader>
              <CardTitle>购买入口暂不可用</CardTitle>
              <CardDescription>{query.error.message}</CardDescription>
            </CardHeader>
          </Card>
        ) : query.data ? (
          <>
            <section className="space-y-2">
              <p className="text-muted-foreground text-sm">
                {query.data.partner.name} /{' '}
                {query.data.partner.defaultVariantId}
              </p>
              <h1 className="text-3xl font-semibold tracking-normal">
                伙伴购买入口
              </h1>
              <p className="text-muted-foreground max-w-2xl text-sm">
                通过该入口购买的授权会归属到当前伙伴渠道，支付成功后可由伙伴后台统一查看和导出。
              </p>
            </section>
            <PartnerChannelPurchaseCard
              channelCode={channelCode}
              products={query.data.products}
            />
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

function PartnerChannelPurchaseCard({
  channelCode,
  products,
}: {
  channelCode: string;
  products: ProductOption[];
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
            channel_code: channelCode,
            seats,
            metadata: { source: 'partner_channel_buy' },
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
        window.location.href = `/partner/${encodeURIComponent(channelCode)}/buy`;
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
          选择产品和席位数量，订单将自动带上伙伴渠道标记。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="partner-channel-product">产品</Label>
          <select
            id="partner-channel-product"
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
          <Label htmlFor="partner-channel-seats">席位数量</Label>
          <Input
            id="partner-channel-seats"
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
