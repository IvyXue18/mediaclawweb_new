import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import task from '../../tasks/referral/settle';

const mocks = vi.hoisted(() => ({
  processLockedCommissionsSettlement: vi.fn(),
  withDbRequestScope: vi.fn(async (callback: () => unknown) => callback()),
}));

vi.mock('@/core/db', () => ({
  withDbRequestScope: mocks.withDbRequestScope,
}));

vi.mock('@/modules/referral/service', () => ({
  processLockedCommissionsSettlement: mocks.processLockedCommissionsSettlement,
}));

describe('weekly referral settlement task', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.processLockedCommissionsSettlement.mockResolvedValue({
      processed: 2,
      settled: 2,
      frozen: 0,
      skipped: 0,
    });
  });

  it('uses an unambiguous Cloudflare-compatible Sunday schedule', () => {
    const config = readFileSync(
      new URL('../../vite.config.ts', import.meta.url),
      'utf8'
    );
    expect(config).toMatch(
      /['"]15 18 \* \* SUN['"]:\s*\[['"]referral:settle['"]\]/
    );
    expect(config).not.toContain("'15 18 * * 0'");
  });

  it('runs settlement inside a database request scope', async () => {
    const result = await task.run({
      name: 'referral:settle',
      payload: {},
      context: {},
    });

    expect(mocks.withDbRequestScope).toHaveBeenCalledOnce();
    expect(mocks.processLockedCommissionsSettlement).toHaveBeenCalledOnce();
    expect(result).toEqual({
      result: { processed: 2, settled: 2, frozen: 0, skipped: 0 },
    });
  });
});
