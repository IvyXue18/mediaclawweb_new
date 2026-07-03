import { POST } from '@/app/api/internal/payment/repair/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findOrderByOrderNo: vi.fn(),
  repairOrderPayment: vi.fn(),
}));

vi.mock('@/config', () => ({
  envConfigs: {
    auth_secret: 'repair-secret',
  },
}));

vi.mock('@/shared/models/order', () => ({
  findOrderByOrderNo: (...args: any[]) => mocks.findOrderByOrderNo(...args),
}));

vi.mock('@/shared/services/payment', () => ({
  repairOrderPayment: (...args: any[]) => mocks.repairOrderPayment(...args),
}));

function buildRequest({
  token = 'repair-secret',
  body,
}: {
  token?: string;
  body: Record<string, any>;
}) {
  return new Request('https://mediaclaw.example/api/internal/payment/repair', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-token': token,
    },
    body: JSON.stringify(body),
  });
}

describe('/api/internal/payment/repair contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findOrderByOrderNo.mockResolvedValue({
      orderNo: 'ORDER-REPAIR-1',
      status: 'created',
    });
    mocks.repairOrderPayment.mockResolvedValue({
      orderNo: 'ORDER-REPAIR-1',
      paymentStatus: 'paid',
      repaired: true,
    });
  });

  it('rejects requests without the internal auth token', async () => {
    const response = await POST(
      buildRequest({
        token: 'wrong-token',
        body: { orderNo: 'ORDER-REPAIR-1' },
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: 'Unauthorized',
    });
    expect(mocks.findOrderByOrderNo).not.toHaveBeenCalled();
  });

  it('validates the order number before loading the order', async () => {
    const response = await POST(
      buildRequest({
        body: { orderNo: '' },
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: 'orderNo is required',
    });
    expect(mocks.findOrderByOrderNo).not.toHaveBeenCalled();
  });

  it('returns 404 for missing orders', async () => {
    mocks.findOrderByOrderNo.mockResolvedValue(null);

    const response = await POST(
      buildRequest({
        body: { order_no: 'ORDER-MISSING' },
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: 'order not found: ORDER-MISSING',
    });
    expect(mocks.repairOrderPayment).not.toHaveBeenCalled();
  });

  it('returns 409 when the provider session is not successful yet', async () => {
    mocks.repairOrderPayment.mockResolvedValue({
      orderNo: 'ORDER-REPAIR-1',
      paymentStatus: 'processing',
      repaired: false,
    });

    const response = await POST(
      buildRequest({
        body: { orderNo: 'ORDER-REPAIR-1' },
      })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: 'payment is not successful yet: processing',
      data: {
        orderNo: 'ORDER-REPAIR-1',
        paymentStatus: 'processing',
      },
    });
  });

  it('returns a stable success payload after payment repair succeeds', async () => {
    const response = await POST(
      buildRequest({
        body: { orderNo: 'ORDER-REPAIR-1' },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      message: 'Payment order repaired',
      data: {
        orderNo: 'ORDER-REPAIR-1',
        paymentStatus: 'paid',
      },
    });
    expect(mocks.repairOrderPayment).toHaveBeenCalledWith({
      orderNo: 'ORDER-REPAIR-1',
      status: 'created',
    });
  });
});
