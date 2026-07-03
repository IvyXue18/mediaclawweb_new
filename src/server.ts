import handler from '@tanstack/react-start/server-entry';

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

// Custom server entry — wraps every request in Paraglide's middleware so
// getLocale() resolves per-request (AsyncLocalStorage) during SSR. TanStack's
// router rewrite owns URL de-localization, so the handler receives the original
// request; passing Paraglide's rewritten request causes /en/* self-redirects.
export default {
  async fetch(req: Request): Promise<Response> {
    await ensureCloudflareEnv();
    const url = new URL(req.url);
    const isApiRequest = url.pathname.startsWith('/api/');
    const response = isApiRequest
      ? await handler.fetch(req)
      : await paraglideMiddleware(req, () => handler.fetch(req));
    const host = req.headers.get('host') || '';

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
