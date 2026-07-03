import { POST } from '@/app/api/payment/checkout/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getTranslations: vi.fn(),
  getUserInfo: vi.fn(),
  getAllConfigs: vi.fn(),
  getPaymentService: vi.fn(),
  createPayment: vi.fn(),
  createOrder: vi.fn(),
  updateOrderByOrderNo: vi.fn(),
  findCredentialByCodeAndOwner: vi.fn(),
  findPartnerSupplierByPartnerId: vi.fn(),
  findPartnerSupplierByChannelCode: vi.fn(),
  getInviteeDiscount: vi.fn(),
  getSnowId: vi.fn(),
  getUuid: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: (...args: any[]) => mocks.getTranslations(...args),
}));

vi.mock('@/config', () => ({
  envConfigs: {
    app_url: 'https://mediaclaw.example',
  },
}));

vi.mock('@/shared/lib/hash', () => ({
  getSnowId: () => mocks.getSnowId(),
  getUuid: () => mocks.getUuid(),
}));

vi.mock('@/shared/models/user', () => ({
  getUserInfo: () => mocks.getUserInfo(),
}));

vi.mock('@/shared/models/config', () => ({
  getAllConfigs: () => mocks.getAllConfigs(),
}));

vi.mock('@/shared/models/credential', () => ({
  findCredentialByCodeAndOwner: (...args: any[]) =>
    mocks.findCredentialByCodeAndOwner(...args),
}));

vi.mock('@/shared/models/partner', () => ({
  normalizePartnerId: (value: string) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48),
  normalizeChannelCode: (value: string) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48),
  calculatePartnerCheckoutAmount: ({
    unitAmount,
    seats,
    priceRuleType,
    priceRuleValue,
  }: any) => {
    if (priceRuleType === 'fixed_unit') return priceRuleValue * seats;
    return Math.round(unitAmount * seats * (1 - priceRuleValue / 100));
  },
  findPartnerSupplierByPartnerId: (...args: any[]) =>
    mocks.findPartnerSupplierByPartnerId(...args),
  findPartnerSupplierByChannelCode: (...args: any[]) =>
    mocks.findPartnerSupplierByChannelCode(...args),
  isSupplierCurrentlyActive: (supplier: any) =>
    supplier?.status === 'active' &&
    (!supplier.contractStartAt || supplier.contractStartAt <= new Date()) &&
    (!supplier.contractEndAt || supplier.contractEndAt >= new Date()),
}));

vi.mock('@/shared/models/order', () => ({
  OrderStatus: {
    PENDING: 'pending',
    CREATED: 'created',
    COMPLETED: 'completed',
    PAID: 'paid',
    FAILED: 'failed',
  },
  OrderCredentialAction: {
    NONE: 'none',
    ISSUE: 'issue',
    RECHARGE: 'recharge',
  },
  OrderCredentialSyncStatus: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    DONE: 'done',
    FAILED: 'failed',
  },
  createOrder: (...args: any[]) => mocks.createOrder(...args),
  updateOrderByOrderNo: (...args: any[]) => mocks.updateOrderByOrderNo(...args),
}));

vi.mock('@/shared/services/payment', () => ({
  getPaymentService: () => mocks.getPaymentService(),
}));

vi.mock('@/shared/services/referral', () => ({
  getInviteeDiscount: (...args: any[]) => mocks.getInviteeDiscount(...args),
  applyDiscount: (amount: number, discountRate: number) =>
    discountRate > 0 && discountRate < 100
      ? Math.floor((amount * (100 - discountRate)) / 100)
      : amount,
}));

const pricingItems = [
  {
    product_id: 'pro-1m',
    product_name: 'MediaClaw Pro',
    plan_name: 'Pro',
    description: 'Pro monthly',
    amount: 9900,
    currency: 'CNY',
    credits: 100,
    valid_days: 30,
    interval: 'one-time',
    payment_providers: ['zpay'],
  },
  {
    product_id: 'credits-100',
    product_name: 'MediaClaw Credits',
    description: 'Credits pack',
    amount: 2900,
    currency: 'CNY',
    credits: 100,
    valid_days: 0,
    interval: 'one-time',
    group: 'credits',
    payment_providers: ['zpay'],
  },
];

function buildRequest(body: Record<string, any>, headers?: HeadersInit) {
  return new Request('https://mediaclaw.example/api/payment/checkout', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(headers || {}),
    },
    body: JSON.stringify(body),
  });
}

describe('/api/payment/checkout contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTranslations.mockResolvedValue({
      raw: () => ({
        items: pricingItems.map((item) => ({ ...item })),
      }),
    });
    mocks.getUserInfo.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'MediaClaw User',
    });
    mocks.getAllConfigs.mockResolvedValue({
      app_name: 'MediaClaw',
      app_url: 'https://mediaclaw.example',
      default_locale: 'zh',
      default_payment_provider: 'zpay',
      pricing_products: JSON.stringify({
        'pro-1m': {
          amount: 9900,
          currency: 'CNY',
          credits: 100,
          type: 'credential',
          duration_preset: '1m',
          max_bindings: 1,
          status: 'active',
        },
        'credits-100': {
          amount: 2900,
          currency: 'CNY',
          credits: 100,
          type: 'credits_only',
          status: 'active',
        },
      }),
    });
    mocks.getPaymentService.mockResolvedValue({
      getProvider: () => ({
        name: 'zpay',
        createPayment: mocks.createPayment,
      }),
    });
    mocks.createPayment.mockResolvedValue({
      provider: 'zpay',
      checkoutParams: { pid: '1001' },
      checkoutInfo: {
        sessionId: 'ORDER-1001',
        checkoutUrl: 'https://mediaclaw.example/zh/checkout/zpay',
      },
      checkoutResult: { code: 1 },
      metadata: { order_no: 'ORDER-1001' },
    });
    mocks.createOrder.mockResolvedValue(undefined);
    mocks.updateOrderByOrderNo.mockResolvedValue(undefined);
    mocks.findCredentialByCodeAndOwner.mockResolvedValue({
      id: 'credential-1',
      code: 'ACT-PAID-0000',
      ownerUserId: 'user-1',
      planCode: 'pro-1m',
    });
    mocks.findPartnerSupplierByPartnerId.mockResolvedValue(undefined);
    mocks.findPartnerSupplierByChannelCode.mockResolvedValue(undefined);
    mocks.getInviteeDiscount.mockResolvedValue(10);
    mocks.getSnowId.mockReturnValue('ORDER-1001');
    mocks.getUuid.mockReturnValue('uuid-order-1');
  });

  it('requires a credential code for credit-only products', async () => {
    const response = await POST(
      buildRequest({
        product_id: 'credits-100',
        locale: 'zh',
        payment_provider: 'zpay',
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'credential_code is required for credits-only products',
    });
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it('rejects credit packs for trial activation codes', async () => {
    mocks.findCredentialByCodeAndOwner.mockResolvedValue({
      id: 'credential-trial',
      code: 'ACT-TRIAL-0000',
      ownerUserId: 'user-1',
      planCode: 'trial',
    });

    const response = await POST(
      buildRequest({
        product_id: 'credits-100',
        locale: 'zh',
        payment_provider: 'zpay',
        credential_code: 'ACT-TRIAL-0000',
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message:
        'trial activation codes cannot buy credit packs; upgrade to a paid plan first',
    });
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it('creates a Zpay checkout order with referral discount and recharge action', async () => {
    const response = await POST(
      buildRequest(
        {
          product_id: 'credits-100',
          locale: 'zh',
          payment_provider: 'zpay',
          credential_code: 'ACT-PAID-0000',
          device: 'mobile',
        },
        {
          'x-forwarded-for': '203.0.113.10',
        }
      )
    );

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        sessionId: 'ORDER-1001',
        checkoutUrl: 'https://mediaclaw.example/zh/checkout/zpay',
      },
    });

    expect(mocks.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'uuid-order-1',
        orderNo: 'ORDER-1001',
        userId: 'user-1',
        status: 'pending',
        amount: 2900,
        currency: 'cny',
        paymentProvider: 'zpay',
        creditsAmount: 100,
        discountCode: 'referral_invitee_10',
        discountAmount: 290,
        credentialAction: 'recharge',
        credentialSyncStatus: 'pending',
        credentialCode: 'ACT-PAID-0000',
      })
    );

    const checkoutOrder = mocks.createPayment.mock.calls[0][0].order;
    expect(checkoutOrder.price).toMatchObject({
      amount: 2610,
      currency: 'cny',
    });
    expect(checkoutOrder.metadata).toMatchObject({
      order_no: 'ORDER-1001',
      user_id: 'user-1',
      invitee_discount_rate: 10,
      device: 'mobile',
      clientip: '203.0.113.10',
    });
    expect(checkoutOrder.metadata.callback_url).toBe(
      'https://mediaclaw.example/settings/payments?order_no=ORDER-1001'
    );
  });

  it('marks the order completed when provider checkout creation fails', async () => {
    mocks.createPayment.mockRejectedValue(new Error('provider unavailable'));

    const response = await POST(
      buildRequest({
        product_id: 'pro-1m',
        locale: 'zh',
        payment_provider: 'zpay',
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'checkout failed: provider unavailable',
    });
    expect(mocks.updateOrderByOrderNo).toHaveBeenCalledWith(
      'ORDER-1001',
      expect.objectContaining({
        status: 'completed',
      })
    );
  });

  it('creates partner bulk checkout using supplier price rule and no referral discount', async () => {
    mocks.findPartnerSupplierByPartnerId.mockResolvedValue({
      id: 'supplier-1',
      name: 'Supplier One',
      partnerId: 'supplier-one',
      userId: 'user-1',
      status: 'active',
      contractStartAt: new Date('2026-01-01T00:00:00Z'),
      contractEndAt: null,
      defaultVariantId: 'supplier-one-white-label',
      priceRuleType: 'percent_off',
      priceRuleValue: 20,
    });

    const response = await POST(
      buildRequest({
        product_id: 'pro-1m',
        locale: 'zh',
        payment_provider: 'zpay',
        partner_id: 'Supplier One',
        seats: 5,
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
    });

    expect(mocks.getInviteeDiscount).not.toHaveBeenCalled();
    expect(mocks.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 49500,
        discountCode: 'partner_supplier-one',
        discountAmount: 9900,
        creditsAmount: 0,
        credentialAction: 'issue',
        partnerId: 'supplier-one',
        variantId: 'supplier-one-white-label',
        seatCount: 5,
      })
    );

    const createdOrder = mocks.createOrder.mock.calls[0][0];
    expect(JSON.parse(createdOrder.priceRuleSnapshot)).toMatchObject({
      partnerId: 'supplier-one',
      variantId: 'supplier-one-white-label',
      seats: 5,
      baseTotalAmount: 49500,
      finalAmount: 39600,
      creditsPerSeat: 100,
    });

    const checkoutOrder = mocks.createPayment.mock.calls[0][0].order;
    expect(checkoutOrder.price).toMatchObject({
      amount: 39600,
      currency: 'cny',
    });
    expect(checkoutOrder.metadata).toMatchObject({
      partner_id: 'supplier-one',
      variant_id: 'supplier-one-white-label',
      seats: 5,
    });
    expect(checkoutOrder.metadata.callback_url).toBe(
      'https://mediaclaw.example/partner?order_no=ORDER-1001'
    );
    expect(checkoutOrder.productId).toBeUndefined();
  });

  it('creates public channel checkout without requiring supplier-bound user', async () => {
    mocks.findPartnerSupplierByChannelCode.mockResolvedValue({
      id: 'supplier-1',
      name: 'Supplier One',
      partnerId: 'supplier-one',
      channelCode: 'supplier-buy',
      userId: 'supplier-user',
      status: 'active',
      contractStartAt: new Date('2026-01-01T00:00:00Z'),
      contractEndAt: null,
      defaultVariantId: 'supplier-one-white-label',
      priceRuleType: 'percent_off',
      priceRuleValue: 20,
    });

    const response = await POST(
      buildRequest({
        product_id: 'pro-1m',
        locale: 'zh',
        payment_provider: 'zpay',
        channel_code: 'Supplier Buy',
        seats: 2,
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
    });

    expect(mocks.findPartnerSupplierByPartnerId).not.toHaveBeenCalled();
    expect(mocks.findPartnerSupplierByChannelCode).toHaveBeenCalledWith(
      'supplier-buy'
    );
    expect(mocks.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        discountCode: 'partner_supplier-one',
        partnerId: 'supplier-one',
        variantId: 'supplier-one-white-label',
        seatCount: 2,
      })
    );
    const checkoutOrder = mocks.createPayment.mock.calls[0][0].order;
    expect(checkoutOrder.metadata.callback_url).toBe(
      'https://mediaclaw.example/partner/supplier-buy/buy?order_no=ORDER-1001'
    );
    expect(checkoutOrder.cancelUrl).toBe(
      'https://mediaclaw.example/partner/supplier-buy/buy'
    );
  });

  it('rejects partner checkout for credit pack products', async () => {
    const response = await POST(
      buildRequest({
        product_id: 'credits-100',
        locale: 'zh',
        payment_provider: 'zpay',
        partner_id: 'supplier-one',
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'partner checkout only supports credential products',
    });
    expect(mocks.findPartnerSupplierByPartnerId).not.toHaveBeenCalled();
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it('rejects partner checkout when trying to recharge an existing credential', async () => {
    const response = await POST(
      buildRequest({
        product_id: 'pro-1m',
        locale: 'zh',
        payment_provider: 'zpay',
        partner_id: 'supplier-one',
        credential_code: 'ACT-PAID-0000',
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'partner checkout does not support credential recharge',
    });
    expect(mocks.findPartnerSupplierByPartnerId).not.toHaveBeenCalled();
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it('rejects partner checkout above the seat limit', async () => {
    const response = await POST(
      buildRequest({
        product_id: 'pro-1m',
        locale: 'zh',
        payment_provider: 'zpay',
        partner_id: 'supplier-one',
        seats: 501,
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'seat count exceeds partner checkout limit',
    });
    expect(mocks.findPartnerSupplierByPartnerId).not.toHaveBeenCalled();
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it('rejects direct partner checkout for another supplier user', async () => {
    mocks.findPartnerSupplierByPartnerId.mockResolvedValue({
      id: 'supplier-1',
      name: 'Supplier One',
      partnerId: 'supplier-one',
      userId: 'other-user',
      status: 'active',
      contractStartAt: new Date('2026-01-01T00:00:00Z'),
      contractEndAt: null,
      defaultVariantId: 'supplier-one-white-label',
      priceRuleType: 'percent_off',
      priceRuleValue: 20,
    });

    const response = await POST(
      buildRequest({
        product_id: 'pro-1m',
        locale: 'zh',
        payment_provider: 'zpay',
        partner_id: 'supplier-one',
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'partner not found or not bound to current user',
    });
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it('rejects inactive partner suppliers for new purchases', async () => {
    mocks.findPartnerSupplierByChannelCode.mockResolvedValue({
      id: 'supplier-1',
      name: 'Supplier One',
      partnerId: 'supplier-one',
      channelCode: 'supplier-buy',
      userId: 'supplier-user',
      status: 'disabled',
      contractStartAt: new Date('2026-01-01T00:00:00Z'),
      contractEndAt: null,
      defaultVariantId: 'supplier-one-white-label',
      priceRuleType: 'percent_off',
      priceRuleValue: 20,
    });

    const response = await POST(
      buildRequest({
        product_id: 'pro-1m',
        locale: 'zh',
        payment_provider: 'zpay',
        channel_code: 'supplier-buy',
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'partner is not active for new purchases',
    });
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });
});
