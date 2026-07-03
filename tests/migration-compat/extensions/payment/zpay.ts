import crypto from 'node:crypto';

import {
  PaymentEventType,
  PaymentStatus,
  type CheckoutSession,
  type PaymentConfigs,
  type PaymentEvent,
  type PaymentOrder,
  type PaymentSession,
} from './types';

export interface ZpayConfigs extends PaymentConfigs {
  pid: string;
  pkey: string;
}

export class ZpayProvider {
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
    const checkoutUrl =
      order.metadata?.callback_url ||
      order.successUrl ||
      `https://zpayz.cn/submit.php?out_trade_no=${encodeURIComponent(orderNo)}`;

    return {
      provider: this.name,
      checkoutParams: {
        pid: this.configs.pid,
        out_trade_no: orderNo,
        money: (order.price.amount / 100).toFixed(2),
        sign_type: 'MD5',
      },
      checkoutInfo: {
        sessionId: orderNo,
        checkoutUrl: String(checkoutUrl),
      },
      checkoutResult: { code: 1 },
      metadata: { order_no: orderNo },
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
    const url = new URL(req.url);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    if (req.method === 'POST') {
      const text = await req.clone().text();
      const searchParams = new URLSearchParams(text);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }

    const receivedSign = params.sign;
    const paramsToSign = { ...params };
    delete paramsToSign.sign;
    delete paramsToSign.sign_type;

    const expectedSign = this.sign(paramsToSign);
    if (receivedSign !== expectedSign) {
      throw new Error(
        `Invalid Zpay signature: received=${receivedSign}, expected=${expectedSign}`
      );
    }

    const isPaid = params.trade_status === 'TRADE_SUCCESS';
    const paymentAmount = Math.round(parseFloat(params.money || '0') * 100);
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
              paymentAmount,
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

  private sign(params: Record<string, string>): string {
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
}
