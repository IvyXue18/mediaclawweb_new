import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { apiGet } from '@/lib/api-client';
import { createQrSvg } from '@/lib/qr-code';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { buttonVariants } from '@/components/ui/button';

type ZpaySearch = {
  order_no?: string;
  amount?: number;
  name?: string;
  provider?: string;
  submit_url?: string;
  return_url?: string;
  callback_url?: string;
  cancel_url?: string;
  pay_url?: string;
  qrcode?: string;
  img?: string;
};

type PaymentStatusData = {
  orderNo?: string;
  status?: string;
  credentialAction?: string;
  credentialSyncStatus?: string | null;
  credentialSyncError?: string | null;
  credentialCode?: string | null;
};

function searchAmount(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const amount = Number(value.replace(/^"|"$/g, ''));
    if (Number.isFinite(amount)) return amount;
  }
  return undefined;
}

function searchString(value: unknown) {
  if (typeof value === 'string') return value;
  return undefined;
}

function safeZpayUrl(input?: string) {
  if (!input) return '';
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:') return '';
    if (url.hostname !== 'zpayz.cn') return '';
    return url.toString();
  } catch {
    return '';
  }
}

function safeImageUrl(input?: string) {
  if (!input) return '';
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

function safeQrContent(input?: string) {
  if (!input) return '';
  try {
    const url = new URL(input);
    if (
      url.protocol === 'alipay:' ||
      url.protocol === 'alipays:' ||
      url.protocol === 'weixin:' ||
      url.protocol === 'wxp:'
    ) {
      return input;
    }
    if (
      url.protocol === 'https:' &&
      ['zpayz.cn', 'qr.alipay.com', 'wx.tenpay.com'].includes(url.hostname)
    ) {
      return url.toString();
    }
    return '';
  } catch {
    return '';
  }
}

function localQrImageUrl(value?: string) {
  if (!value) return '';
  try {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      createQrSvg(value)
    )}`;
  } catch {
    return '';
  }
}

function publicCredentialSyncMessage(value?: string | null) {
  if (!value) return '';
  const text = String(value);
  if (
    text.includes('Failed query') ||
    text.includes('insert into') ||
    text.includes('params:')
  ) {
    return '支付已确认，但权益发放暂未完成。请点击“我已完成支付”重试，或稍后到订单页查看。';
  }
  return text;
}

function safeInternalHref(input: string | undefined, fallback: string) {
  if (!input) return fallback;
  try {
    const appOrigin = new URL(envConfigs.app_url).origin;
    const url = new URL(input, appOrigin);
    if (url.origin !== appOrigin) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

function statusLabel(status?: string) {
  if (status === 'paid') return '支付已确认';
  if (status === 'failed') return '支付失败';
  if (status === 'completed') return '订单已关闭';
  return '等待付款';
}

function ZpayCheckoutPage() {
  const search = Route.useSearch();
  const submitUrl = safeZpayUrl(search.submit_url);
  const payUrl = safeZpayUrl(search.pay_url) || submitUrl;
  const qrValue = safeQrContent(search.qrcode) || payUrl;
  const generatedQrImageSrc = useMemo(
    () => localQrImageUrl(qrValue),
    [qrValue]
  );
  const qrImageSrc = safeImageUrl(search.img) || generatedQrImageSrc;
  const amount =
    typeof search.amount === 'number'
      ? `¥${search.amount.toFixed(2)}`
      : '待确认';
  const orderNo = search.order_no || '未提供';
  const productName = search.name || 'MediaClaw 订单';
  const callbackHref = safeInternalHref(
    search.callback_url || search.return_url,
    '/settings/payments'
  );
  const cancelHref = safeInternalHref(search.cancel_url, '/pricing');

  const statusQuery = useQuery({
    queryKey: ['zpay-payment-status', search.order_no],
    queryFn: () =>
      apiGet<PaymentStatusData>(
        `/api/payment/status?order_no=${encodeURIComponent(search.order_no || '')}`
      ),
    enabled: Boolean(search.order_no),
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.status === 'paid' ? false : 3000,
  });

  const manualCheck = useMutation({
    mutationFn: () =>
      apiGet<PaymentStatusData>(
        `/api/payment/status?order_no=${encodeURIComponent(search.order_no || '')}&sync=1`
      ),
    onSuccess: (data) => {
      if (data.status === 'paid') {
        window.location.href = callbackHref;
        return;
      }
      toast.message('暂未检测到支付完成，请完成支付后再试');
    },
    onError: () => {
      toast.error('检查支付状态失败，请稍后重试');
    },
  });

  async function handleCopy(value: string, successMessage: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error('复制失败，请手动复制');
    }
  }

  const latestStatus = manualCheck.data || statusQuery.data;
  const paid = latestStatus?.status === 'paid';
  const credentialSyncMessage = publicCredentialSyncMessage(
    latestStatus?.credentialSyncError
  );

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 border-b bg-neutral-50 px-4 py-10 dark:bg-neutral-950">
        <div className="mx-auto w-full max-w-5xl">
          <Link
            href="/pricing"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="size-4" />
            返回定价
          </Link>

          <div
            className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-xl shadow-neutral-950/5 dark:bg-neutral-950"
            data-zpay-checkout
          >
            <div className="grid md:grid-cols-[1.08fr_0.92fr]">
              <section
                className="bg-muted/30 flex flex-col items-center justify-center px-6 py-8 md:px-10"
                data-zpay-qr-panel
              >
                <div className="w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-lg dark:bg-neutral-900">
                  {qrImageSrc ? (
                    <img
                      src={qrImageSrc}
                      alt="支付二维码"
                      className="h-auto w-full rounded-xl border bg-white"
                      data-zpay-qr-image
                    />
                  ) : (
                    <div
                      className="border-muted-foreground/20 text-muted-foreground flex min-h-[320px] items-center justify-center rounded-xl border border-dashed px-6 text-center text-sm"
                      data-zpay-qr-placeholder
                    >
                      当前缺少可生成二维码的支付内容，请复制支付链接到支付宝中打开。
                    </div>
                  )}
                </div>

                <p className="text-muted-foreground mt-4 text-center text-sm">
                  请使用支付宝 App
                  扫码付款，之后右侧点击完成支付。（移动端按钮在下面）
                </p>
              </section>

              <section className="flex flex-col justify-center px-6 py-8 md:px-10">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-700 dark:text-emerald-400">
                  {paid ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <ShieldCheck className="size-4" />
                  )}
                  <span data-zpay-status-badge>
                    {statusLabel(latestStatus?.status)}
                  </span>
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-normal">
                  Mediaclaw 收银台
                </h1>
                <p className="text-muted-foreground mt-3 text-sm leading-6">
                  请核对订单信息后扫码或打开支付链接。支付完成后，本页会自动轮询订单状态，也可以手动确认。
                </p>

                <div className="mt-6 space-y-3 rounded-2xl border p-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">
                      商品
                    </p>
                    <p className="mt-1 font-medium">{productName}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-xs uppercase">
                      订单号
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <code
                        className="flex-1 font-mono text-xs break-all sm:text-sm"
                        data-zpay-order-no
                      >
                        {orderNo}
                      </code>
                      <button
                        type="button"
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                          className: 'shrink-0',
                        })}
                        disabled={!search.order_no}
                        onClick={() => handleCopy(orderNo, '订单号已复制')}
                        data-zpay-copy-order
                      >
                        <Copy className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-xs uppercase">
                      金额
                    </p>
                    <p className="mt-1 text-xl font-semibold">{amount}</p>
                  </div>

                  {payUrl ? (
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">
                        支付链接
                      </p>
                      <div className="mt-1">
                        <a
                          href={payUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary inline-flex items-center gap-1 text-sm underline underline-offset-4"
                          data-zpay-pay-url
                        >
                          <ExternalLink className="size-4" />
                          打开支付链接
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>

                {latestStatus?.credentialCode ? (
                  <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                    激活码已发放：
                    <span className="font-mono">
                      {latestStatus.credentialCode}
                    </span>
                  </div>
                ) : null}

                {credentialSyncMessage ? (
                  <div className="text-destructive border-destructive/20 bg-destructive/10 mt-4 rounded-xl border p-3 text-sm">
                    {credentialSyncMessage}
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    className={buttonVariants()}
                    disabled={!search.order_no || manualCheck.isPending}
                    onClick={() => manualCheck.mutate()}
                    data-zpay-check-status
                  >
                    {manualCheck.isPending ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    我已完成支付
                  </button>

                  {payUrl ? (
                    <a
                      href={payUrl}
                      target="_blank"
                      className={buttonVariants({ variant: 'outline' })}
                      rel="noopener noreferrer"
                      data-zpay-open-pay
                    >
                      <ExternalLink className="size-4" />
                      打开支付链接
                    </a>
                  ) : null}

                  <Link
                    href={cancelHref}
                    className={buttonVariants({ variant: 'outline' })}
                  >
                    取消
                  </Link>
                </div>

                {paid ? (
                  <Link
                    href={callbackHref}
                    className={buttonVariants({
                      variant: 'secondary',
                      className: 'mt-3 w-fit',
                    })}
                    data-zpay-paid-redirect
                  >
                    支付已确认，查看订单
                  </Link>
                ) : null}

                <div className="text-muted-foreground mt-6 space-y-2 text-sm">
                  <p>完成付款后，请点击“我已完成支付”确认订单状态。</p>
                  <p>
                    如扫码无法识别，可点击“打开支付链接”或复制链接到支付宝中打开。
                  </p>
                  <p>
                    页面每 3
                    秒自动查询一次订单状态；没有真实通知前会保持等待付款。
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export const Route = createFileRoute('/checkout/zpay')({
  validateSearch: (search: Record<string, unknown>): ZpaySearch => ({
    order_no: searchString(search.order_no),
    amount: searchAmount(search.amount),
    name: searchString(search.name),
    provider: searchString(search.provider),
    submit_url: searchString(search.submit_url),
    return_url: searchString(search.return_url),
    callback_url: searchString(search.callback_url),
    cancel_url: searchString(search.cancel_url),
    pay_url: searchString(search.pay_url),
    qrcode: searchString(search.qrcode),
    img: searchString(search.img),
  }),
  head: () => ({
    meta: [
      {
        title: 'Mediaclaw 收银台 - MediaClaw',
      },
      {
        name: 'description',
        content: 'MediaClaw Zpay checkout handoff page.',
      },
    ],
  }),
  component: ZpayCheckoutPage,
});
