import { POST } from '@/routes/api/analytics/events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  values: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@/core/auth', () => ({
  getAuth: () => ({ api: { getSession: mocks.getSession } }),
}));

vi.mock('@/config', () => ({
  envConfigs: { app_url: 'https://mediaclaw.app' },
}));

vi.mock('@/core/db', () => ({
  db: () => ({ insert: () => ({ values: mocks.values }) }),
}));

vi.mock('@/config/db/schema', () => ({ eventLog: {} }));
vi.mock('@/lib/hash', () => ({ getUuid: () => 'event-1' }));

function request(
  body: Record<string, unknown>,
  origin = 'https://mediaclaw.app'
) {
  return new Request('https://mediaclaw.app/api/analytics/events', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin,
    },
    body: JSON.stringify(body),
  });
}

describe('analytics event ingestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.__minIntervalRateLimitStore?.clear();
    mocks.getSession.mockResolvedValue(null);
    mocks.values.mockResolvedValue(undefined);
  });

  it('rejects cross-site ingestion', async () => {
    const response = await POST({
      request: request(
        { eventName: 'page_view', anonymousId: 'anonymous-1' },
        'https://attacker.example'
      ),
    });

    expect(response.status).toBe(403);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it('rejects unsupported events', async () => {
    const response = await POST({
      request: request({ eventName: 'mouse_move', anonymousId: 'anonymous-1' }),
    });

    expect(response.status).toBe(400);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it('stores an allowed event and ignores a forged user id', async () => {
    const response = await POST({
      request: request({
        eventName: 'page_view',
        source: 'web',
        anonymousId: 'anonymous-1',
        userId: 'forged-user',
        channel: 'wechat',
      }),
    });

    expect(response.status).toBe(200);
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'page_view',
        anonymousId: 'anonymous-1',
        userId: '',
        channel: 'wechat',
      })
    );
  });
});
