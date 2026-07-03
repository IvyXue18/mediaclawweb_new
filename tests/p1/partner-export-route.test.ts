import { GET } from '@/app/api/partner/credentials/export/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSignUser: vi.fn(),
  findPartnerSupplierByUserId: vi.fn(),
  getPartnerCredentials: vi.fn(),
}));

vi.mock('@/shared/models/user', () => ({
  getSignUser: () => mocks.getSignUser(),
}));

vi.mock('@/shared/models/partner', () => ({
  findPartnerSupplierByUserId: (...args: any[]) =>
    mocks.findPartnerSupplierByUserId(...args),
  getPartnerCredentials: (...args: any[]) =>
    mocks.getPartnerCredentials(...args),
  isSupplierCurrentlyActive: (supplier: any) =>
    supplier?.status === 'active' && !supplier.deletedAt,
}));

describe('/api/partner/credentials/export contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSignUser.mockResolvedValue({
      id: 'supplier-user',
      email: 'supplier@example.com',
    });
    mocks.findPartnerSupplierByUserId.mockResolvedValue({
      id: 'supplier-1',
      partnerId: 'supplier-one',
      status: 'active',
      deletedAt: null,
    });
    mocks.getPartnerCredentials.mockResolvedValue([
      {
        code: 'ACT-ONE-0000-0000',
        status: 'active',
        activationStatus: 'activated',
        planCode: 'pro-1m',
        partnerId: 'supplier-one',
        variantId: 'supplier-one-white-label',
        sourceOrderNo: 'ORDER-1001',
        assignmentNote: 'Alice, "VIP"',
        activatedAt: new Date('2026-06-17T01:00:00.000Z'),
        expiresAt: new Date('2026-07-17T01:00:00.000Z'),
        createdAt: new Date('2026-06-17T00:00:00.000Z'),
      },
    ]);
  });

  it('rejects anonymous export requests', async () => {
    mocks.getSignUser.mockResolvedValue(null);

    const response = await GET(
      new Request('https://mediaclaw.example/api/partner/credentials/export')
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: 'no auth',
    });
    expect(mocks.findPartnerSupplierByUserId).not.toHaveBeenCalled();
  });

  it('rejects users without an active supplier binding', async () => {
    mocks.findPartnerSupplierByUserId.mockResolvedValue(null);

    const response = await GET(
      new Request('https://mediaclaw.example/api/partner/credentials/export')
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: 'partner access denied',
    });
    expect(mocks.getPartnerCredentials).not.toHaveBeenCalled();
  });

  it('rejects disabled supplier bindings', async () => {
    mocks.findPartnerSupplierByUserId.mockResolvedValue({
      id: 'supplier-1',
      partnerId: 'supplier-one',
      status: 'disabled',
      deletedAt: null,
    });

    const response = await GET(
      new Request('https://mediaclaw.example/api/partner/credentials/export')
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: 'partner access denied',
    });
    expect(mocks.getPartnerCredentials).not.toHaveBeenCalled();
  });

  it('exports only the current supplier credential scope as CSV', async () => {
    const response = await GET(
      new Request(
        'https://mediaclaw.example/api/partner/credentials/export?status=activated'
      )
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/csv');
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="mediaclaw-supplier-one-credentials.csv"'
    );
    expect(mocks.getPartnerCredentials).toHaveBeenCalledWith({
      partnerId: 'supplier-one',
      status: 'activated',
      limit: 10000,
    });

    const csv = await response.text();
    expect(csv).toContain(
      'code,status,activationStatus,planCode,partnerId,variantId,sourceOrderNo,assignmentNote,activatedAt,expiresAt,createdAt'
    );
    expect(csv).toContain('ACT-ONE-0000-0000');
    expect(csv).toContain('"Alice, ""VIP"""');
    expect(csv).toContain('supplier-one-white-label');
  });
});
