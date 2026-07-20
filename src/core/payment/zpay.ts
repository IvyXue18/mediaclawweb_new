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

type ZpayMapiResponse = {
  code?: number | string;
  msg?: string;
  trade_no?: string;
  payurl?: string;
  pay_url?: string;
  qrcode?: string;
  img?: string;
  urlscheme?: string;
  url?: string;
};

type ZpayOrderQueryResponse = {
  code?: number | string;
  msg?: string;
  trade_no?: string;
  out_trade_no?: string;
  money?: string;
  status?: number | string;
  buyer?: string;
  endtime?: string;
  param?: string;
};

export class ZpayProvider implements PaymentProvider {
  readonly name = 'zpay';
  configs: ZpayConfigs;
  private readonly mapiUrl = 'https://zpayz.cn/mapi.php';
  private readonly queryUrl = 'https://zpayz.cn/api.php';

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

    const paymentType =
      String(order.metadata?.payment_type || 'alipay') === 'wxpay'
        ? 'wxpay'
        : 'alipay';
    const returnUrl = order.successUrl || this.returnUrl(orderNo);
    const clientip = String(order.metadata?.clientip || '127.0.0.1');
    const device = String(order.metadata?.device || 'pc');
    const params: Record<string, string> = {
      pid: this.configs.pid,
      type: paymentType,
      out_trade_no: orderNo,
      notify_url: this.notifyUrl(),
      return_url: returnUrl,
      name: order.description || order.productId || 'MediaClaw',
      money: (order.price.amount / 100).toFixed(2),
      clientip,
      device,
      sign_type: 'MD5',
    };
    params.sign = this.sign(params);

    const submitUrl = `https://zpayz.cn/submit.php?${new URLSearchParams(params).toString()}`;
    let checkoutResult: ZpayMapiResponse | Record<string, string | number> = {
      code: 1,
      outTradeNo: orderNo,
    };
    let checkoutUrl = this.buildLocalCheckoutUrl({
      order_no: orderNo,
      amount: params.money,
      name: params.name,
      submit_url: submitUrl,
      return_url: params.return_url,
      cancel_url: order.cancelUrl,
    });

    try {
      const result = await this.createMapiPayment(params);
      if (result) {
        checkoutResult = result;
        checkoutUrl = this.buildLocalCheckoutUrl({
          order_no: orderNo,
          amount: params.money,
          name: params.name,
          submit_url: submitUrl,
          return_url: params.return_url,
          cancel_url: order.cancelUrl,
          pay_url: result.payurl || result.pay_url || result.url,
          qrcode: result.qrcode || result.urlscheme,
          img: result.img,
        });
      }
    } catch (error: any) {
      console.warn('Zpay mapi checkout fallback:', error?.message || error);
    }

    return {
      provider: this.name,
      checkoutParams: params,
      checkoutInfo: {
        sessionId: orderNo,
        checkoutUrl,
      },
      checkoutResult,
      metadata: {
        ...(order.metadata || {}),
        order_no: orderNo,
        trade_no:
          typeof checkoutResult.trade_no === 'string'
            ? checkoutResult.trade_no
            : undefined,
      },
    };
  }

  async getPaymentSession({
    sessionId,
  }: {
    sessionId: string;
  }): Promise<PaymentSession> {
    return this.queryPaymentSession({
      reference: sessionId,
      queryKey: 'out_trade_no',
      orderNo: sessionId,
    });
  }

  async getPaymentSessionByTradeNo({
    tradeNo,
    orderNo,
  }: {
    tradeNo: string;
    orderNo: string;
  }): Promise<PaymentSession> {
    return this.queryPaymentSession({
      reference: tradeNo,
      queryKey: 'trade_no',
      orderNo,
    });
  }

  private async queryPaymentSession({
    reference,
    queryKey,
    orderNo,
  }: {
    reference: string;
    queryKey: 'out_trade_no' | 'trade_no';
    orderNo: string;
  }): Promise<PaymentSession> {
    try {
      const url = new URL(this.queryUrl);
      url.searchParams.set('act', 'order');
      url.searchParams.set('pid', this.configs.pid);
      url.searchParams.set('key', this.configs.pkey);
      url.searchParams.set(queryKey, reference);

      const response = await fetch(url.toString());
      const data = (await response.json()) as ZpayOrderQueryResponse;
      if (String(data.code) !== '1') {
        console.warn('[Zpay] order query did not resolve', {
          queryKey,
          orderNo,
          code: data.code,
          message: data.msg,
        });
        return this.processingSession(orderNo, data);
      }

      // A trade-number lookup is used as the fallback for callbacks whose
      // signature could not be reproduced. In that path the provider response
      // itself must bind both identifiers; never fill a missing merchant order
      // number from the untrusted callback request.
      if (
        queryKey === 'trade_no' &&
        (String(data.trade_no || '').trim() !== reference ||
          String(data.out_trade_no || '').trim() !== orderNo)
      ) {
        console.warn('[Zpay] trade lookup identity mismatch', {
          orderNo,
          returnedOrderNo: data.out_trade_no,
          returnedTradeNo: data.trade_no,
        });
        return this.processingSession(orderNo, data);
      }

      const isPaid = String(data.status) === '1';
      if (!isPaid) {
        console.warn('[Zpay] order query returned unpaid', {
          queryKey,
          orderNo,
          status: data.status,
          returnedOrderNo: data.out_trade_no,
        });
      }
      const paymentAmount = Math.round(parseFloat(data.money || '0') * 100);
      return {
        provider: this.name,
        paymentStatus: isPaid
          ? PaymentStatus.SUCCESS
          : PaymentStatus.PROCESSING,
        paymentInfo: isPaid
          ? {
              paymentAmount,
              paymentCurrency: 'CNY',
              transactionId: data.trade_no,
              paidAt: data.endtime ? new Date(data.endtime) : new Date(),
            }
          : undefined,
        paymentResult: {
          ...data,
          out_trade_no: data.out_trade_no || orderNo,
        },
        metadata: {
          order_no: data.out_trade_no || orderNo,
          buyer: data.buyer,
          param: data.param,
        },
      };
    } catch (error: any) {
      console.warn('[Zpay] order query failed', {
        queryKey,
        orderNo,
        message: error?.message || String(error),
      });
    }

    return this.processingSession(orderNo);
  }

  private processingSession(
    sessionId: string,
    paymentResult: Record<string, unknown> = { sessionId }
  ): PaymentSession {
    return {
      provider: this.name,
      paymentStatus: PaymentStatus.PROCESSING,
      paymentResult: {
        ...paymentResult,
        out_trade_no: String(paymentResult.out_trade_no || sessionId),
      },
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

    const receivedSign = String(params.sign || '')
      .trim()
      .toLowerCase();
    const expectedSign = this.sign(params);
    if (receivedSign !== expectedSign) {
      // ZPay callback parameters are form encoded, where `+` represents a
      // space. Some channels sign after an extra decode pass, so a literal
      // plus in a product name is signed as a space. This remains a keyed MD5
      // verification; only the transport normalization differs.
      const plusAsSpaceParams = Object.fromEntries(
        Object.entries(params).map(([key, value]) => [
          key,
          value.replace(/\+/g, ' '),
        ])
      );
      const plusAsSpaceSign = this.sign(plusAsSpaceParams);
      if (receivedSign !== plusAsSpaceSign) {
        throw new Error('Invalid Zpay signature');
      }
      console.warn(
        '[Zpay] accepted callback signature using plus-as-space normalization',
        { orderNo: params.out_trade_no }
      );
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

  private async createMapiPayment(params: Record<string, string>) {
    const response = await fetch(this.mapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params).toString(),
    });

    if (!response.ok) {
      throw new Error(
        `Zpay mapi request failed with status ${response.status}`
      );
    }

    const result = (await response.json()) as ZpayMapiResponse;
    if (String(result.code) !== '1') {
      throw new Error(`Zpay mapi error: ${result.msg || 'Unknown error'}`);
    }

    if (
      !result.payurl &&
      !result.pay_url &&
      !result.url &&
      !result.qrcode &&
      !result.urlscheme &&
      !result.img
    ) {
      throw new Error('Zpay mapi returned no pay url or qr code');
    }

    return result;
  }

  private buildLocalCheckoutUrl(params: {
    order_no: string;
    amount: string;
    name: string;
    submit_url: string;
    return_url: string;
    cancel_url?: string;
    pay_url?: string;
    qrcode?: string;
    img?: string;
  }) {
    const url = new URL(this.localCheckoutUrl());
    url.searchParams.set('provider', this.name);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
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
