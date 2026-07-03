import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';

const FIXED_ALLOWED_HOSTS = new Set(['media.mediaclaw.app']);

function configuredAllowedHosts() {
  return [envConfigs.app_url, envConfigs.storage_public_domain]
    .map((value) => {
      try {
        return value ? new URL(value).hostname.toLowerCase() : '';
      } catch {
        return '';
      }
    })
    .filter(Boolean);
}

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.startsWith('127.') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

function isAllowedProxyUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;

    const hostname = url.hostname.toLowerCase();
    if (isPrivateHost(hostname)) return false;

    return (
      FIXED_ALLOWED_HOSTS.has(hostname) ||
      configuredAllowedHosts().includes(hostname)
    );
  } catch {
    return false;
  }
}

async function GET({ request }: { request: Request }) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url') || '';

  if (!url) {
    return new Response('Missing url parameter', { status: 400 });
  }
  if (!isAllowedProxyUrl(url)) {
    return new Response('Invalid url parameter', { status: 400 });
  }

  try {
    const response = await fetch(url, { redirect: 'manual' });
    if (!response.ok) {
      return new Response(`Failed to fetch file: ${response.statusText}`, {
        status: response.status,
      });
    }

    const headers = new Headers();
    headers.set(
      'content-type',
      response.headers.get('content-type') || 'application/octet-stream'
    );
    const cacheControl = response.headers.get('cache-control');
    if (cacheControl) headers.set('cache-control', cacheControl);

    return new Response(response.body, { headers });
  } catch {
    return new Response('Internal Server Error', { status: 500 });
  }
}

export const Route = createFileRoute('/api/proxy/file')({
  server: { handlers: { GET } },
});
