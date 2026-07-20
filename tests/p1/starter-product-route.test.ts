import { GET } from '@/routes/api/starter/product';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getStarterProduct: vi.fn(),
  getBenefitRewardConfig: vi.fn(),
}));

vi.mock('@/modules/starter/service', () => ({
  getStarterProduct: (...args: any[]) => mocks.getStarterProduct(...args),
}));

vi.mock('@/modules/benefits/service', () => ({
  getBenefitRewardConfig: (...args: any[]) =>
    mocks.getBenefitRewardConfig(...args),
}));

describe('starter product API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStarterProduct.mockResolvedValue({
      status: 'active',
      priceInCents: 900,
      durationDays: 5,
      credits: 80,
      currency: 'cny',
    });
    mocks.getBenefitRewardConfig.mockResolvedValue({
      channel_survey: {
        enabled: true,
        existingCredential: { durationDays: 2, credits: 0 },
      },
    });
  });

  it('bypasses isolate memory caches and disables HTTP caching', async () => {
    const response = await GET();

    expect(mocks.getStarterProduct).toHaveBeenCalledWith({
      bypassCache: true,
    });
    expect(mocks.getBenefitRewardConfig).toHaveBeenCalledWith({
      bypassCache: true,
    });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: { credits: 80 },
    });
  });
});
