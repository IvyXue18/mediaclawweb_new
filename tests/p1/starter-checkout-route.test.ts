import { POST } from '@/routes/api/payment/checkout';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getAllConfigs: vi.fn(),
  getCredentialByCode: vi.fn(),
  findPartnerByBusinessId: vi.fn(),
  createCheckout: vi.fn(),
  cancelPendingCheckout: vi.fn(),
  getStarterStatus: vi.fn(),
  expireStaleStarterOrders: vi.fn(),
  expireStaleStarterDeductionOrders: vi.fn(),
  getActiveStarterDeductionOrder: vi.fn(),
  getApplicableStarterDeduction: vi.fn(),
  getStarterBrowserInstallHash: vi.fn(),
  getStarterDeductionReservationKey: vi.fn(),
  analyticsEvents: [] as any[],
}));

vi.mock('@/core/auth', () => ({
  getAuth: () => ({ api: { getSession: mocks.getSession } }),
}));

vi.mock('@/config', () => ({
  envConfigs: { app_url: 'https://mediaclaw.example' },
}));

vi.mock('@/modules/config/service', () => ({
  getAllConfigs: (...args: any[]) => mocks.getAllConfigs(...args),
}));

vi.mock('@/modules/credentials/service', () => ({
  getCredentialByCode: (...args: any[]) => mocks.getCredentialByCode(...args),
}));

vi.mock('@/modules/partners/service', () => ({
  findPartnerByBusinessId: (...args: any[]) =>
    mocks.findPartnerByBusinessId(...args),
  isPartnerCurrentlyActive: () => true,
  partnerBusinessId: (row: any) => row?.partnerId || '',
}));

vi.mock('@/modules/payment/service', () => ({
  DEDUCTION_RESERVATION_CONFLICT_CODE: 'DEDUCTION_RESERVATION_CONFLICT',
  createCheckout: (...args: any[]) => mocks.createCheckout(...args),
  cancelPendingCheckout: (...args: any[]) =>
    mocks.cancelPendingCheckout(...args),
}));

vi.mock('@/modules/starter/service', () => ({
  STARTER_DEDUCTION_CODE: 'trial_deduction',
  STARTER_PRODUCT_ID: 'trial-starter',
  getStarterStatus: (...args: any[]) => mocks.getStarterStatus(...args),
  expireStaleStarterOrders: (...args: any[]) =>
    mocks.expireStaleStarterOrders(...args),
  expireStaleStarterDeductionOrders: (...args: any[]) =>
    mocks.expireStaleStarterDeductionOrders(...args),
  getActiveStarterDeductionOrder: (...args: any[]) =>
    mocks.getActiveStarterDeductionOrder(...args),
  getApplicableStarterDeduction: (...args: any[]) =>
    mocks.getApplicableStarterDeduction(...args),
  getStarterBrowserInstallHash: (...args: any[]) =>
    mocks.getStarterBrowserInstallHash(...args),
  getStarterDeductionReservationKey: (...args: any[]) =>
    mocks.getStarterDeductionReservationKey(...args),
  isPaidTrialCredential: (row: any) =>
    String(row?.planCode || '').toLowerCase() === 'trial' &&
    Boolean(String(row?.sourceOrderNo || '').trim()),
}));

vi.mock('@/lib/rate-limit', () => ({
  enforceMinIntervalRateLimit: () => null,
}));

vi.mock('@/lib/server-analytics', () => ({
  recordServerAnalyticsEvent: async (event: any) => {
    mocks.analyticsEvents.push(event);
  },
}));

function request(body: Record<string, unknown>) {
  return new Request('https://mediaclaw.example/api/payment/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('current checkout route starter-card contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.analyticsEvents = [];
    mocks.getSession.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'MediaClaw User',
      },
    });
    mocks.getAllConfigs.mockResolvedValue({});
    mocks.findPartnerByBusinessId.mockResolvedValue(null);
    mocks.getStarterStatus.mockResolvedValue({
      eligible: true,
      reason: '',
      pendingOrder: null,
    });
    mocks.expireStaleStarterOrders.mockResolvedValue(undefined);
    mocks.expireStaleStarterDeductionOrders.mockResolvedValue(undefined);
    mocks.getActiveStarterDeductionOrder.mockResolvedValue(null);
    mocks.getApplicableStarterDeduction.mockResolvedValue(0);
    mocks.getStarterBrowserInstallHash.mockReturnValue('browser-hash-1');
    mocks.getStarterDeductionReservationKey.mockReturnValue(
      'user-1:trial_deduction'
    );
    mocks.createCheckout.mockResolvedValue({
      provider: 'zpay',
      checkoutInfo: { checkoutUrl: 'https://pay.example/ORDER-1' },
    });
    mocks.cancelPendingCheckout.mockResolvedValue({
      canceled: true,
      status: 'failed',
    });
    mocks.getCredentialByCode.mockResolvedValue({
      id: 'credential-1',
      ownerUserId: 'user-1',
      planCode: 'pro-1m',
      sourceOrderNo: 'ORDER-OLD',
      status: 'active',
    });
  });

  it('rejects accounts that already received any trial entitlement', async () => {
    mocks.getStarterStatus.mockResolvedValue({
      eligible: false,
      reason: 'has_free_trial',
    });

    const response = await POST({
      request: request({ product_id: 'trial-starter' }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'starter_not_eligible:has_free_trial',
    });
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it('creates a 900-cent card order with 5-day membership and non-expiring credits', async () => {
    const response = await POST({
      request: request({
        product_id: 'trial-starter',
        browser_install_id: 'browser-install-1',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        checkoutUrl: 'https://pay.example/ORDER-1',
        checkout_url: 'https://pay.example/ORDER-1',
      },
    });

    const input = mocks.createCheckout.mock.calls[0][0];
    expect(input).toMatchObject({
      credits: 50,
      creditsValidDays: 0,
      credentialAction: 'issue',
      discountCode: null,
      discountAmount: 0,
      starterBrowserInstallHash: 'browser-hash-1',
      paymentOrder: {
        productId: 'trial-starter',
        price: { amount: 900, currency: 'cny' },
        successUrl: 'https://mediaclaw.example/welfare/claim',
      },
    });
    expect(JSON.parse(input.priceRuleSnapshot)).toEqual({
      planCode: 'trial',
      durationDays: 5,
      creditsNeverExpire: true,
      maxBindings: 1,
    });
    expect(mocks.expireStaleStarterOrders).toHaveBeenCalledWith('user-1');
    expect(mocks.getStarterStatus).toHaveBeenCalledWith(
      'user-1',
      'browser-install-1'
    );
  });

  it('rejects another account that already used the same browser', async () => {
    mocks.getStarterStatus.mockResolvedValue({
      eligible: false,
      reason: 'browser_already_used',
      pendingOrder: null,
    });

    const response = await POST({
      request: request({
        product_id: 'trial-starter',
        browser_install_id: 'browser-install-1',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'starter_not_eligible:browser_already_used',
    });
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it('reuses an existing payable starter order instead of creating a duplicate', async () => {
    mocks.getStarterStatus.mockResolvedValue({
      eligible: false,
      reason: 'has_pending_order',
      pendingOrder: {
        orderNo: 'STARTER-PENDING-1',
        status: 'pending',
        checkoutUrl: 'https://pay.example/STARTER-PENDING-1',
      },
    });

    const response = await POST({
      request: request({ product_id: 'trial-starter' }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        checkout_url: 'https://pay.example/STARTER-PENDING-1',
        orderNo: 'STARTER-PENDING-1',
        reused: true,
      },
    });
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it('automatically applies the full card deduction to the first new plan purchase', async () => {
    mocks.getApplicableStarterDeduction.mockResolvedValue(900);

    await POST({ request: request({ product_id: 'pro-1m' }) });

    expect(mocks.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        discountCode: 'trial_deduction',
        discountAmount: 900,
        deductionReservationKey: 'user-1:trial_deduction',
        paymentOrder: expect.objectContaining({
          price: { amount: 4000, currency: 'cny' },
        }),
      })
    );
  });

  it('reuses the checkout that already owns the starter deduction', async () => {
    mocks.getActiveStarterDeductionOrder.mockResolvedValue({
      orderNo: 'ORDER-DISCOUNT-1',
      productId: 'pro-1m',
      status: 'created',
      checkoutUrl: 'https://pay.example/ORDER-DISCOUNT-1',
    });

    const response = await POST({
      request: request({ product_id: 'pro-1m' }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        orderNo: 'ORDER-DISCOUNT-1',
        checkout_url: 'https://pay.example/ORDER-DISCOUNT-1',
        reused: true,
      },
    });
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it('replaces a pending deduction checkout when the user selects another product', async () => {
    mocks.getActiveStarterDeductionOrder.mockResolvedValue({
      orderNo: 'ORDER-QUARTERLY-1',
      productId: 'pro-3m',
      status: 'created',
      checkoutUrl: 'https://pay.example/ORDER-QUARTERLY-1',
    });
    mocks.getApplicableStarterDeduction.mockResolvedValue(900);

    const response = await POST({
      request: request({ product_id: 'pro-1m' }),
    });

    await expect(response.json()).resolves.toMatchObject({ code: 0 });
    expect(mocks.cancelPendingCheckout).toHaveBeenCalledWith({
      userId: 'user-1',
      orderNo: 'ORDER-QUARTERLY-1',
      reason: 'checkout_replaced',
    });
    expect(mocks.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        discountAmount: 900,
        paymentOrder: expect.objectContaining({
          productId: 'pro-1m',
          price: { amount: 4000, currency: 'cny' },
        }),
      })
    );
  });

  it('returns a retryable conflict when another request wins the deduction race', async () => {
    mocks.getApplicableStarterDeduction.mockResolvedValue(900);
    mocks.createCheckout.mockRejectedValue(
      Object.assign(new Error('reservation conflict'), {
        code: 'DEDUCTION_RESERVATION_CONFLICT',
      })
    );

    const response = await POST({
      request: request({ product_id: 'pro-1m' }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'starter_deduction_checkout_in_progress',
    });
  });

  it('does not consume the deduction for a credential recharge', async () => {
    mocks.getApplicableStarterDeduction.mockResolvedValue(900);

    await POST({
      request: request({
        product_id: 'pro-1m',
        credential_code: 'ACT-PAID-0000',
      }),
    });

    expect(mocks.getApplicableStarterDeduction).not.toHaveBeenCalled();
    expect(mocks.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        credentialAction: 'recharge',
        discountCode: null,
        discountAmount: 0,
        paymentOrder: expect.objectContaining({
          price: { amount: 4900, currency: 'cny' },
        }),
      })
    );
  });

  it('allows renewing a personal credential with another personal billing period', async () => {
    await POST({
      request: request({
        product_id: 'pro-yearly',
        credential_code: 'ACT-PERSONAL-0000',
      }),
    });

    expect(mocks.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        credentialAction: 'recharge',
        credentialCode: 'ACT-PERSONAL-0000',
        paymentOrder: expect.objectContaining({ productId: 'pro-yearly' }),
      })
    );
  });

  it('rejects renewing a team plan with a personal credential', async () => {
    const response = await POST({
      request: request({
        product_id: 'team-yearly',
        credential_code: 'ACT-PERSONAL-0000',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: '暂无团队版激活码，请选择新购激活码',
    });
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it('does not treat a trial credential as a renewable personal credential', async () => {
    mocks.getCredentialByCode.mockResolvedValue({
      id: 'credential-trial',
      ownerUserId: 'user-1',
      planCode: 'trial',
      maxBindings: 1,
      sourceOrderNo: 'ORDER-TRIAL',
      status: 'active',
    });

    const response = await POST({
      request: request({
        product_id: 'pro-1m',
        credential_code: 'ACT-TRIAL-0000',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: '暂无个人版激活码，请选择新购激活码',
    });
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });
});
