import handler from '@tanstack/react-start/server-entry';

import { envConfigs } from './config';
import { paraglideMiddleware } from './paraglide/server.js';

// On Cloudflare Workers, stash the binding env (D1, ASSETS, …) on globalThis
// so synchronous code paths (e.g. the db() singleton with DATABASE_PROVIDER=d1)
// can reach bindings without threading the request context through every call.
// The specifier is kept non-literal so bundlers leave the import to runtime;
// outside workerd the import rejects and we just move on.
const CF_WORKERS_MODULE = 'cloudflare:workers';
let cfEnvPromise: Promise<void> | null = null;

function ensureCloudflareEnv(): Promise<void> {
  if (!cfEnvPromise) {
    cfEnvPromise = import(/* @vite-ignore */ CF_WORKERS_MODULE)
      .then((mod) => {
        (globalThis as any).__CF_ENV__ = mod.env;
      })
      .catch(() => {
        // Not running on Cloudflare Workers — nothing to stash.
      });
  }
  return cfEnvPromise;
}

function isPreviewHost(host: string) {
  const normalized = host.toLowerCase().split(':')[0];
  return (
    normalized.endsWith('.workers.dev') ||
    normalized.endsWith('.pages.dev') ||
    normalized.includes('preview') ||
    normalized.includes('staging')
  );
}

function isLocalHost(host: string) {
  const normalized = host.toLowerCase().split(':')[0];
  return normalized === 'localhost' || normalized === '127.0.0.1';
}

function rewriteRequestCookie(cookie: string | null) {
  if (!cookie) return cookie;
  return cookie.replace(/(^|;\s*)better-auth\./g, '$1__Secure-better-auth.');
}

function splitSetCookieHeader(header: string) {
  return header
    .split(/,(?=\s*[^;,=\s]+=)/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getSetCookieHeaders(headers: Headers) {
  const getSetCookie = (headers as any).getSetCookie;
  if (typeof getSetCookie === 'function') {
    const values = getSetCookie.call(headers);
    if (Array.isArray(values) && values.length > 0) return values;
  }

  const combined = headers.get('set-cookie');
  return combined ? splitSetCookieHeader(combined) : [];
}

function rewriteResponseCookie(cookie: string) {
  return cookie
    .replace(/^__Secure-better-auth\./, 'better-auth.')
    .replace(/^__Host-better-auth\./, 'better-auth.')
    .replace(/;\s*Secure/gi, '')
    .replace(/;\s*Domain=[^;]*/gi, '');
}

async function proxyLocalApiRequest(req: Request, origin: string) {
  const requestUrl = new URL(req.url);
  const proxyUrl = new URL(
    `${requestUrl.pathname}${requestUrl.search}`,
    origin
  );
  const headers = new Headers(req.headers);
  const rewrittenCookie = rewriteRequestCookie(headers.get('cookie'));
  if (rewrittenCookie) {
    headers.set('cookie', rewrittenCookie);
  } else {
    headers.delete('cookie');
  }
  headers.set('x-mediaclaw-local-proxy', '1');
  headers.delete('host');

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req.body;
  }

  let response: Response;
  try {
    response = await fetch(proxyUrl, init);
  } catch (error) {
    console.error('[local-api-proxy] fetch failed', error);
    return Response.json(
      {
        error: true,
        message: 'Local API proxy failed',
      },
      {
        status: 502,
        headers: {
          'x-mediaclaw-local-api-proxy': 'error',
        },
      }
    );
  }
  const responseHeaders = new Headers(response.headers);
  const setCookies = getSetCookieHeaders(response.headers);
  responseHeaders.delete('set-cookie');
  for (const cookie of setCookies) {
    responseHeaders.append('set-cookie', rewriteResponseCookie(cookie));
  }
  responseHeaders.set('x-mediaclaw-local-api-proxy', 'hit');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

// Custom server entry — wraps every request in Paraglide's middleware so
// getLocale() resolves per-request (AsyncLocalStorage) during SSR. TanStack's
// router rewrite owns URL de-localization, so the handler receives the original
// request; passing Paraglide's rewritten request causes /en/* self-redirects.
export default {
  async fetch(req: Request): Promise<Response> {
    await ensureCloudflareEnv();
    const url = new URL(req.url);
    const isApiRequest = url.pathname.startsWith('/api/');
    const host = req.headers.get('host') || '';
    const proxyOrigin = envConfigs.local_api_proxy_origin;

    if (isApiRequest && proxyOrigin && isLocalHost(host)) {
      return proxyLocalApiRequest(req, proxyOrigin);
    }

    const response = isApiRequest
      ? await handler.fetch(req)
      : await paraglideMiddleware(req, () => handler.fetch(req));

    if (!isPreviewHost(host)) {
      return response;
    }

    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
