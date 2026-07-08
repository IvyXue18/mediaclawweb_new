export const DEFAULT_AUTH_REDIRECT_PATH = '/download';

const AUTH_ROUTE_PATTERN =
  /^\/(sign-in|sign-up|verify-email|auth-callback)(\/|\?|$)/;

export type AuthRedirectTarget =
  | { kind: 'web'; path: string }
  | { kind: 'protocol'; url: URL };

export function isSafeAuthCallbackPath(path: string) {
  return (
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !AUTH_ROUTE_PATTERN.test(path)
  );
}

export function getSafeAuthCallbackPath(path?: string | null) {
  return path && isSafeAuthCallbackPath(path) ? path : null;
}

export function resolveAuthRedirectTarget(
  raw: string | null | undefined,
  origin: string
): AuthRedirectTarget {
  if (!raw) return { kind: 'web', path: DEFAULT_AUTH_REDIRECT_PATH };

  if (isSafeAuthCallbackPath(raw)) return { kind: 'web', path: raw };

  try {
    const url = new URL(raw, origin);
    if (url.origin === origin) {
      const path = `${url.pathname}${url.search}${url.hash}`;
      return {
        kind: 'web',
        path: getSafeAuthCallbackPath(path) || DEFAULT_AUTH_REDIRECT_PATH,
      };
    }

    if (url.protocol === 'mediaclaw:' || url.protocol === 'her:') {
      return { kind: 'protocol', url };
    }
  } catch {}

  return { kind: 'web', path: DEFAULT_AUTH_REDIRECT_PATH };
}
