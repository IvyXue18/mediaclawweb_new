import { GET as getBillingPortal } from '@/routes/api/user/subscriptions/billing';
import { GET as getSubscriptionDetail } from '@/routes/api/user/subscriptions/detail';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUserSubscriptionByNo: vi.fn(),
  getUserSubscriptionBillingPortal: vi.fn(),
}));

vi.mock('@/core/auth', () => ({
  getAuth: () => ({
    api: {
      getSession: (...args: any[]) => mocks.getSession(...args),
    },
  }),
}));

vi.mock('@/modules/subscriptions/service', () => ({
  getUserSubscriptionByNo: (...args: any[]) =>
    mocks.getUserSubscriptionByNo(...args),
}));

vi.mock('@/modules/payment/service', () => ({
  getUserSubscriptionBillingPortal: (...args: any[]) =>
    mocks.getUserSubscriptionBillingPortal(...args),
}));

function buildRequest(path: string) {
  return new Request(`https://mediaclaw.example${path}`);
}

describe('billing action API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });
    mocks.getUserSubscriptionByNo.mockResolvedValue({
      id: 'sub-row-1',
      userId: 'user-1',
      subscriptionNo: 'SUB-001',
      status: 'active',
    });
    mocks.getUserSubscriptionBillingPortal.mockResolvedValue({
      billingUrl: 'https://billing.example/session',
      subscriptionNo: 'SUB-001',
      paymentProvider: 'stripe',
    });
  });

  it('requires auth before returning subscription detail', async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await getSubscriptionDetail({
      request: buildRequest(
        '/api/user/subscriptions/detail?subscriptionNo=SUB-001'
      ),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'Unauthorized',
    });
    expect(mocks.getUserSubscriptionByNo).not.toHaveBeenCalled();
  });

  it('returns owned subscription detail by subscription no', async () => {
    const response = await getSubscriptionDetail({
      request: buildRequest(
        '/api/user/subscriptions/detail?subscriptionNo=SUB-001'
      ),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        subscriptionNo: 'SUB-001',
        status: 'active',
      },
    });
    expect(mocks.getUserSubscriptionByNo).toHaveBeenCalledWith({
      userId: 'user-1',
      subscriptionNo: 'SUB-001',
    });
  });

  it('validates subscription no before billing portal lookup', async () => {
    const response = await getBillingPortal({
      request: buildRequest('/api/user/subscriptions/billing'),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'subscriptionNo is required',
    });
    expect(mocks.getUserSubscriptionBillingPortal).not.toHaveBeenCalled();
  });

  it('returns provider billing portal with the current origin return URL', async () => {
    const response = await getBillingPortal({
      request: buildRequest(
        '/api/user/subscriptions/billing?subscription_no=SUB-001'
      ),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        billingUrl: 'https://billing.example/session',
        subscriptionNo: 'SUB-001',
        paymentProvider: 'stripe',
      },
    });
    expect(mocks.getUserSubscriptionBillingPortal).toHaveBeenCalledWith({
      userId: 'user-1',
      subscriptionNo: 'SUB-001',
      returnUrl: 'https://mediaclaw.example/settings/billing',
    });
  });
});
