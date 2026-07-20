import { useEffect, useMemo, useState } from 'react';
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
import { apiGet, apiPost } from '@/lib/api-client';
import { createQrSvg } from '@/lib/qr-code';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { ActivationCodeGuideDialog } from '@/components/activation-code-guide-dialog';
import { buttonVariants } from '@/components/ui/button';
import enWelfarePage from '@/content/legacy-pages/en/welfare.json';
import zhWelfarePage from '@/content/legacy-pages/zh/welfare.json';

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
  productId?: string | null;
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

function hasCredentialFulfillment(data?: PaymentStatusData | null) {
  const action = data?.credentialAction || 'none';
  return action !== 'none';
}

function isCredentialFulfilled(data?: PaymentStatusData | null) {
  return (
    data?.status === 'paid' &&
    hasCredentialFulfillment(data) &&
    data.credentialSyncStatus === 'done' &&
    Boolean(data.credentialCode)
  );
}

function isStarterCardPayment(data?: PaymentStatusData | null) {
  return data?.productId === 'trial-starter';
}

function starterClaimHref(orderNo?: string) {
  return `/welfare/claim${
    orderNo ? `?order_no=${encodeURIComponent(orderNo)}` : ''
  }`;
}

function shouldPollPaymentStatus(data?: PaymentStatusData | null) {
  if (data?.status !== 'paid') return true;
  if (!hasCredentialFulfillment(data)) return false;
  return !['done', 'failed'].includes(data.credentialSyncStatus || '');
}

function paymentGuideTitle(
  data: PaymentStatusData | undefined,
  english: boolean
) {
  if (data?.credentialAction === 'recharge') {
    return english
      ? 'Payment complete, access extended'
      : '支付成功，权益已延长';
  }

  return english
    ? 'Payment complete, activation code issued'
    : '支付成功，激活码已发放';
}

function paymentGuideDescription(
  data: PaymentStatusData | undefined,
  english: boolean
) {
  if (data?.credentialAction === 'recharge') {
    return english
      ? 'This activation code has been updated. Re-verify it in the extension to refresh the latest benefits.'
      : '这枚激活码已更新。回到插件重新验证后，即可刷新最新权益。';
  }

  return english
    ? 'Copy the activation code, then follow the steps below to verify and bind it in the extension.'
    : '复制激活码，然后按下面步骤在插件系统配置中验证绑定。';
}

function AlipayBrandHeader() {
  return (
    <div
      className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#1677ff] bg-[#1677ff] px-4 py-3 shadow-sm"
      aria-label="支付宝扫码支付"
      data-zpay-alipay-brand
    >
      <img
        src="/imgs/logos/alipay-logo.png"
        alt="支付宝 ALIPAY"
        className="h-11 min-w-0 object-contain sm:h-14"
        data-zpay-alipay-logo
      />
      <span className="hidden rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white sm:inline-flex">
        扫码支付
      </span>
    </div>
  );
}

function ZpayCheckoutPage() {
  const search = Route.useSearch();
  const locale = getLocale();
  const guideEnglish = locale === 'en';
  const guideFlow = guideEnglish
    ? enWelfarePage.reward_flow
    : zhWelfarePage.reward_flow;
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideShown, setGuideShown] = useState(false);
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
      shouldPollPaymentStatus(query.state.data) ? 3000 : false,
  });

  const manualCheck = useMutation({
    mutationFn: () =>
      apiGet<PaymentStatusData>(
        `/api/payment/status?order_no=${encodeURIComponent(search.order_no || '')}&sync=1`
      ),
    onSuccess: (data) => {
      if (data.status === 'paid') {
        if (isStarterCardPayment(data)) {
          window.location.href = starterClaimHref(
            data.orderNo || search.order_no
          );
          return;
        }
        if (isCredentialFulfilled(data)) {
          setGuideShown(true);
          setGuideOpen(true);
          return;
        }
        if (hasCredentialFulfillment(data)) {
          toast.message('支付已确认，正在发放权益，请稍后再试');
          statusQuery.refetch();
          return;
        }
        window.location.href = callbackHref;
        return;
      }
      toast.message('暂未检测到支付完成，请完成支付后再试');
    },
    onError: () => {
      toast.error('检查支付状态失败，请稍后重试');
    },
  });

  const cancelPayment = useMutation({
    mutationFn: () =>
      apiPost<{ canceled: boolean; status: string }>('/api/payment/cancel', {
        order_no: search.order_no,
      }),
    onSuccess: (data) => {
      window.location.href = data.status === 'paid' ? callbackHref : cancelHref;
    },
    onError: (error: Error) => {
      toast.error(error.message || '取消订单失败，请稍后重试');
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
  const guideTask = latestStatus?.credentialCode
    ? {
        rewardType:
          latestStatus.credentialAction === 'recharge'
            ? 'paid_extension'
            : 'paid_issue',
        rewardCredentialCode: latestStatus.credentialCode,
      }
    : null;
  const paymentContact = guideEnglish
    ? {
        action: 'Need help installing? Scan to contact us',
        title: 'Get installation help',
        description:
          'Add us on WeChat for help downloading, installing, and activating MediaClaw. You can also get product updates and practical usage tips.',
        qrImage: '/wechat.png',
        qrAlt: 'MediaClaw installation support WeChat QR code',
        note: 'Scan with WeChat and mention “Purchased” plus your order email.',
        close: 'Got it',
      }
    : {
        action: '下载安装遇到问题？扫码答疑',
        title: '扫码获取 MediaClaw 专属支持',
        description:
          '我们将为你提供插件下载激活答疑，持续提供版本更新、功能上新与实战用法交流支持。',
        qrImage: '/wechat.png',
        qrAlt: 'MediaClaw 专属支持微信二维码',
        note: '请使用微信扫码添加，备注「已购买」',
        close: '知道了',
      };
  const credentialSyncMessage = publicCredentialSyncMessage(
    latestStatus?.credentialSyncError
  );

  useEffect(() => {
    if (latestStatus?.status === 'paid' && isStarterCardPayment(latestStatus)) {
      window.location.href = starterClaimHref(
        latestStatus.orderNo || search.order_no
      );
      return;
    }
    if (guideShown || !isCredentialFulfilled(latestStatus)) return;
    setGuideShown(true);
    setGuideOpen(true);
  }, [
    guideShown,
    latestStatus?.orderNo,
    latestStatus?.productId,
    latestStatus?.credentialAction,
    latestStatus?.credentialCode,
    latestStatus?.credentialSyncStatus,
    latestStatus?.status,
    search.order_no,
  ]);

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
                  <AlipayBrandHeader />
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
                  请核对订单信息后扫码或打开支付链接。付款后，点击按钮确认完成支付。
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
                      <a
                        href={payUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary inline-flex items-center gap-1 text-sm underline underline-offset-4"
                        data-zpay-pay-url
                      >
                        <ExternalLink className="size-4" />
                        二维码无法显示？打开支付链接
                      </a>
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

                  <button
                    type="button"
                    className={buttonVariants({ variant: 'outline' })}
                    disabled={!search.order_no || cancelPayment.isPending}
                    onClick={() => cancelPayment.mutate()}
                  >
                    {cancelPayment.isPending ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : null}
                    取消
                  </button>
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
              </section>
            </div>
          </div>
        </div>
      </main>
      <ActivationCodeGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        english={guideEnglish}
        rewardFlow={guideFlow}
        task={guideTask}
        title={paymentGuideTitle(latestStatus, guideEnglish)}
        description={paymentGuideDescription(latestStatus, guideEnglish)}
        contact={paymentContact}
        onCopyCode={(code) =>
          handleCopy(
            code,
            guideEnglish ? 'Activation code copied' : '激活码已复制'
          )
        }
      />
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
