import crypto from 'node:crypto';

import {
  PaymentEventType,
  PaymentStatus,
  type CheckoutSession,
  type PaymentConfigs,
  type PaymentEvent,
  type PaymentOrder,
  type PaymentProvider,
  type PaymentSession,
} from './types';

export interface ZpayConfigs extends PaymentConfigs {
  pid: string;
  pkey: string;
  appUrl?: string;
}

export class ZpayProvider implements PaymentProvider {
  readonly name = 'zpay';
  configs: ZpayConfigs;

  constructor(configs: ZpayConfigs) {
    this.configs = configs;

    if (!configs.pid || !configs.pkey) {
      throw new Error('Zpay requires pid and pkey');
    }
  }

  async createPayment({
    order,
  }: {
    order: PaymentOrder;
  }): Promise<CheckoutSession> {
    if (!order.price) {
      throw new Error('price is required');
    }

    const orderNo = String(order.metadata?.order_no || order.orderNo || '');
    if (!orderNo) {
      throw new Error('order_no is required');
    }

    const params: Record<string, string> = {
      pid: this.configs.pid,
      type: String(order.metadata?.payment_type || 'alipay'),
      out_trade_no: orderNo,
      notify_url: this.notifyUrl(),
      return_url: order.successUrl || this.returnUrl(orderNo),
      name: order.description || order.productId || 'MediaClaw',
      money: (order.price.amount / 100).toFixed(2),
      sign_type: 'MD5',
    };
    params.sign = this.sign(params);

    const checkoutUrl = `${this.localCheckoutUrl()}?${new URLSearchParams({
      order_no: orderNo,
      amount: params.money,
      name: params.name,
      provider: this.name,
      submit_url: `https://zpayz.cn/submit.php?${new URLSearchParams(params).toString()}`,
      return_url: params.return_url,
    }).toString()}`;

    return {
      provider: this.name,
      checkoutParams: params,
      checkoutInfo: {
        sessionId: orderNo,
        checkoutUrl,
      },
      checkoutResult: { code: 1, outTradeNo: orderNo },
      metadata: order.metadata || {},
    };
  }

  async getPaymentSession({
    sessionId,
  }: {
    sessionId: string;
  }): Promise<PaymentSession> {
    return {
      provider: this.name,
      paymentStatus: PaymentStatus.PROCESSING,
      paymentResult: { sessionId },
      metadata: {
        order_no: sessionId,
      },
    };
  }

  async getPaymentEvent({ req }: { req: Request }): Promise<PaymentEvent> {
    const params = await readZpayParams(req);

    if (params.pid && params.pid !== this.configs.pid) {
      throw new Error('Invalid Zpay pid');
    }

    const receivedSign = params.sign;
    const expectedSign = this.sign(params);
    if (receivedSign !== expectedSign) {
      throw new Error('Invalid Zpay signature');
    }

    const isPaid = params.trade_status === 'TRADE_SUCCESS';
    const orderNo = params.out_trade_no;

    return {
      eventType: isPaid
        ? PaymentEventType.CHECKOUT_SUCCESS
        : PaymentEventType.PAYMENT_FAILED,
      eventResult: params,
      paymentSession: {
        provider: this.name,
        paymentStatus: isPaid ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
        paymentInfo: isPaid
          ? {
              paymentAmount: Math.round(parseFloat(params.money || '0') * 100),
              paymentCurrency: 'CNY',
              transactionId: params.trade_no,
              paidAt: new Date(),
            }
          : undefined,
        paymentResult: params,
        metadata: {
          order_no: orderNo,
        },
      },
    };
  }

  sign(params: Record<string, string>) {
    const payload = Object.entries(params)
      .filter(
        ([key, value]) =>
          key !== 'sign' && key !== 'sign_type' && value !== '' && value != null
      )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return crypto
      .createHash('md5')
      .update(`${payload}${this.configs.pkey}`)
      .digest('hex')
      .toLowerCase();
  }

  private appUrl() {
    return (this.configs.appUrl || 'http://localhost:3000').replace(/\/+$/, '');
  }

  private localCheckoutUrl() {
    return `${this.appUrl()}/checkout/zpay`;
  }

  private notifyUrl() {
    return `${this.appUrl()}/api/payment/notify/zpay`;
  }

  private returnUrl(orderNo: string) {
    return `${this.appUrl()}/api/payment/callback?order_no=${encodeURIComponent(orderNo)}`;
  }
}

export async function readZpayParams(request: Request) {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  if (request.method === 'POST') {
    const text = await request.clone().text();
    const searchParams = new URLSearchParams(text);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
  }

  return params;
}
