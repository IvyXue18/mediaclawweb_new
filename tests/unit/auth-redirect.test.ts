import { describe, expect, it } from 'vitest';

import {
  DEFAULT_AUTH_REDIRECT_PATH,
  getSafeAuthCallbackPath,
  resolveAuthRedirectTarget,
} from '@/lib/auth-redirect';

const origin = 'https://mediaclaw.app';

describe('auth redirect helpers', () => {
  it('defaults direct login flows to the download page', () => {
    expect(DEFAULT_AUTH_REDIRECT_PATH).toBe('/download');
    expect(resolveAuthRedirectTarget(null, origin)).toEqual({
      kind: 'web',
      path: '/download',
    });
    expect(resolveAuthRedirectTarget('', origin)).toEqual({
      kind: 'web',
      path: '/download',
    });
  });

  it('keeps safe same-site callback paths', () => {
    expect(getSafeAuthCallbackPath('/settings/credentials?tab=active')).toBe(
      '/settings/credentials?tab=active'
    );
    expect(
      resolveAuthRedirectTarget(
        'https://mediaclaw.app/pricing?plan=pro#checkout',
        origin
      )
    ).toEqual({
      kind: 'web',
      path: '/pricing?plan=pro#checkout',
    });
  });

  it('rejects auth loops and unsafe web redirects', () => {
    expect(getSafeAuthCallbackPath('/sign-in')).toBeNull();
    expect(
      getSafeAuthCallbackPath('/auth-callback?redirect=/settings')
    ).toBeNull();
    expect(getSafeAuthCallbackPath('//evil.example/path')).toBeNull();
    expect(
      resolveAuthRedirectTarget('https://evil.example/path', origin)
    ).toEqual({
      kind: 'web',
      path: '/download',
    });
  });

  it('allows supported client protocol redirects', () => {
    const target = resolveAuthRedirectTarget(
      'mediaclaw://auth/callback?source=plugin',
      origin
    );

    expect(target.kind).toBe('protocol');
    if (target.kind === 'protocol') {
      expect(target.url.protocol).toBe('mediaclaw:');
      expect(target.url.searchParams.get('source')).toBe('plugin');
    }
  });
});
