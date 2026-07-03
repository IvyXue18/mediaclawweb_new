import { PayPalProvider } from '@/extensions/payment/paypal';
import { StripeProvider } from '@/extensions/payment/stripe';
import {
  PaymentEventType,
  PaymentStatus,
  SubscriptionCycleType,
} from '@/extensions/payment/types';
import Stripe from 'stripe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

function buildStripeRequest(
  payload: Record<string, any>,
  secret = 'whsec_test'
) {
  const body = JSON.stringify(payload);
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret,
  });

  return new Request('https://mediaclaw.example/api/payment/notify/stripe', {
    method: 'POST',
    headers: {
      'stripe-signature': signature,
    },
    body,
  });
}

function buildPayPalRequest(event: Record<string, any>) {
  return new Request('https://mediaclaw.example/api/payment/notify/paypal', {
    method: 'POST',
    headers: {
      'paypal-auth-algo': 'SHA256withRSA',
      'paypal-cert-url': 'https://api-m.sandbox.paypal.com/certs/test',
      'paypal-transmission-id': 'transmission-1',
      'paypal-transmission-sig': 'signature-1',
      'paypal-transmission-time': '2026-06-16T08:00:00Z',
    },
    body: JSON.stringify(event),
  });
}

function mockPayPalNetwork(provider: PayPalProvider) {
  const makeRequest = vi.fn(async (path: string) => {
    if (path === '/v1/notifications/verify-webhook-signature') {
      return { verification_status: 'SUCCESS' };
    }

    if (path === '/v1/billing/subscriptions/SUB-PAYPAL-1') {
      return {
        id: 'SUB-PAYPAL-1',
        status: 'ACTIVE',
        custom_id: JSON.stringify({ order_no: 'ORDER-PAYPAL-SUB' }),
        billing_info: {
          last_payment: {
            amount: { value: '12.00', currency_code: 'USD' },
            time: '2026-06-16T08:00:00Z',
          },
        },
        subscriber: {
          email_address: 'buyer@example.com',
          name: {
            given_name: 'Media',
            surname: 'Claw',
          },
        },
        plan_id: 'paypal-plan-1',
      };
    }

    throw new Error(`unexpected PayPal request: ${path}`);
  });

  (provider as any).accessToken = 'test-access-token';
  (provider as any).tokenExpiry = Date.now() + 60_000;
  (provider as any).makeRequest = makeRequest;

  return makeRequest;
}

describe('payment provider webhook fixtures', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses a signed Stripe checkout.session.completed event', async () => {
    const provider = new StripeProvider({
      secretKey: 'sk_test_123',
      publishableKey: 'pk_test_123',
      signingSecret: 'whsec_test',
    });

    const event = await provider.getPaymentEvent({
      req: buildStripeRequest({
        id: 'evt_checkout_1',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_1',
            object: 'checkout.session',
            status: 'complete',
            payment_status: 'paid',
            amount_total: 19900,
            currency: 'cny',
            customer: 'cus_1',
            customer_email: 'buyer@example.com',
            customer_details: {
              email: 'buyer@example.com',
              name: 'Media Claw',
            },
            created: 1781587200,
            discounts: [],
            invoice: 'in_1',
            metadata: {
              order_no: 'ORDER-STRIPE-1',
            },
          },
        },
      }),
    });

    expect(event.eventType).toBe(PaymentEventType.CHECKOUT_SUCCESS);
    expect(event.paymentSession).toMatchObject({
      provider: 'stripe',
      paymentStatus: PaymentStatus.SUCCESS,
      paymentInfo: {
        transactionId: 'cs_test_1',
        paymentAmount: 19900,
        paymentCurrency: 'cny',
        paymentEmail: 'buyer@example.com',
        paymentUserName: 'Media Claw',
        paymentUserId: 'cus_1',
        invoiceId: 'in_1',
      },
      metadata: {
        order_no: 'ORDER-STRIPE-1',
      },
    });
  });

  it('parses a signed Stripe invoice.payment_succeeded renewal event', async () => {
    const provider = new StripeProvider({
      secretKey: 'sk_test_123',
      publishableKey: 'pk_test_123',
      signingSecret: 'whsec_test',
    });

    const event = await provider.getPaymentEvent({
      req: buildStripeRequest({
        id: 'evt_invoice_1',
        object: 'event',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_renew_1',
            object: 'invoice',
            amount_paid: 9900,
            currency: 'usd',
            customer: 'cus_renew',
            customer_email: 'renew@example.com',
            customer_name: 'Renew User',
            hosted_invoice_url: 'https://pay.stripe.com/invoice/test',
            created: 1781587200,
            billing_reason: 'subscription_cycle',
            total_discount_amounts: [{ amount: 1000 }],
            lines: { data: [] },
            metadata: {
              order_no: 'ORDER-STRIPE-RENEW',
            },
          },
        },
      }),
    });

    expect(event.eventType).toBe(PaymentEventType.PAYMENT_SUCCESS);
    expect(event.paymentSession).toMatchObject({
      provider: 'stripe',
      paymentStatus: PaymentStatus.SUCCESS,
      paymentInfo: {
        transactionId: 'in_renew_1',
        paymentAmount: 9900,
        paymentCurrency: 'usd',
        invoiceId: 'in_renew_1',
        invoiceUrl: 'https://pay.stripe.com/invoice/test',
        subscriptionCycleType: SubscriptionCycleType.RENEWAL,
      },
      metadata: {
        order_no: 'ORDER-STRIPE-RENEW',
      },
    });
  });

  it('rejects Stripe webhooks with an invalid signature fixture', async () => {
    const provider = new StripeProvider({
      secretKey: 'sk_test_123',
      publishableKey: 'pk_test_123',
      signingSecret: 'whsec_test',
    });

    await expect(
      provider.getPaymentEvent({
        req: new Request(
          'https://mediaclaw.example/api/payment/notify/stripe',
          {
            method: 'POST',
            headers: { 'stripe-signature': 'invalid-signature' },
            body: JSON.stringify({
              id: 'evt_bad',
              object: 'event',
              type: 'checkout.session.completed',
            }),
          }
        ),
      })
    ).rejects.toThrow();
  });

  it('verifies and parses a PayPal capture completed webhook fixture', async () => {
    const provider = new PayPalProvider({
      clientId: 'paypal-client',
      clientSecret: 'paypal-secret',
      webhookId: 'paypal-webhook-id',
      environment: 'sandbox',
    });
    const makeRequest = mockPayPalNetwork(provider);

    const event = await provider.getPaymentEvent({
      req: buildPayPalRequest({
        id: 'WH-PAYPAL-CAPTURE',
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'CAPTURE-1',
          status: 'COMPLETED',
          amount: {
            value: '49.00',
            currency_code: 'CNY',
          },
          seller_receivable_breakdown: {
            discount: {
              value: '5.00',
              currency_code: 'CNY',
            },
          },
          custom_id: JSON.stringify({ order_no: 'ORDER-PAYPAL-1' }),
          create_time: '2026-06-16T08:00:00Z',
        },
      }),
    });

    expect(makeRequest).toHaveBeenCalledWith(
      '/v1/notifications/verify-webhook-signature',
      'POST',
      expect.objectContaining({
        webhook_id: 'paypal-webhook-id',
      })
    );
    expect(event.eventType).toBe(PaymentEventType.PAYMENT_SUCCESS);
    expect(event.paymentSession).toMatchObject({
      provider: 'paypal',
      paymentStatus: PaymentStatus.SUCCESS,
      paymentInfo: {
        transactionId: 'CAPTURE-1',
        paymentAmount: 4900,
        paymentCurrency: 'CNY',
        discountAmount: 500,
        discountCurrency: 'CNY',
        invoiceId: 'CAPTURE-1',
      },
      metadata: {
        order_no: 'ORDER-PAYPAL-1',
      },
    });
  });

  it('verifies and parses a PayPal subscription renewal sale fixture', async () => {
    const provider = new PayPalProvider({
      clientId: 'paypal-client',
      clientSecret: 'paypal-secret',
      webhookId: 'paypal-webhook-id',
      environment: 'sandbox',
    });
    mockPayPalNetwork(provider);

    const event = await provider.getPaymentEvent({
      req: buildPayPalRequest({
        id: 'WH-PAYPAL-SALE',
        event_type: 'PAYMENT.SALE.COMPLETED',
        resource: {
          id: 'SALE-1',
          status: 'COMPLETED',
          billing_agreement_id: 'SUB-PAYPAL-1',
          amount: {
            value: '12.00',
            currency_code: 'USD',
          },
          create_time: '2026-06-16T08:00:00Z',
        },
      }),
    });

    expect(event.eventType).toBe(PaymentEventType.PAYMENT_SUCCESS);
    expect(event.paymentSession).toMatchObject({
      provider: 'paypal',
      paymentStatus: PaymentStatus.SUCCESS,
      subscriptionId: 'SUB-PAYPAL-1',
      paymentInfo: {
        transactionId: 'SALE-1',
        paymentAmount: 1200,
        paymentCurrency: 'USD',
      },
      metadata: {
        order_no: 'ORDER-PAYPAL-SUB',
      },
    });
  });
});
