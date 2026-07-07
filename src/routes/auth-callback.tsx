import { useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';
import { apiGet } from '@/lib/api-client';
import { localizeHref } from '@/paraglide/runtime.js';

type RedirectTarget =
  | { kind: 'web'; path: string }
  | { kind: 'protocol'; url: URL };

function isSafeWebPath(path: string) {
  return (
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !/^\/(sign-in|sign-up|verify-email|auth-callback)(\/|\?|$)/.test(path)
  );
}

function resolveRedirectTarget(raw: string | null): RedirectTarget {
  if (typeof window === 'undefined') return { kind: 'web', path: '/settings' };
  if (!raw) return { kind: 'web', path: '/settings' };

  if (isSafeWebPath(raw)) return { kind: 'web', path: raw };

  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin === window.location.origin) {
      const path = `${url.pathname}${url.search}${url.hash}`;
      return {
        kind: 'web',
        path: isSafeWebPath(path) ? path : '/settings',
      };
    }

    if (url.protocol === 'mediaclaw:' || url.protocol === 'her:') {
      return { kind: 'protocol', url };
    }
  } catch {}

  return { kind: 'web', path: '/settings' };
}

function AuthCallbackPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [message, setMessage] = useState('正在完成登录跳转...');
  const redirect = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('redirect');
  }, []);

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      const currentPath =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/auth-callback';
      router.replace(`/sign-in?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }

    const target = resolveRedirectTarget(redirect);
    if (target.kind === 'web') {
      window.location.assign(localizeHref(target.path));
      return;
    }

    let cancelled = false;
    async function forwardToClient() {
      try {
        setMessage('正在把登录状态交给客户端...');
        const data = await apiGet<{ token: string; cookieName: string }>(
          '/api/auth/token'
        );
        if (cancelled) return;
        target.url.searchParams.set('token', data.token);
        target.url.searchParams.set('cookieName', data.cookieName);
        window.location.assign(target.url.toString());
      } catch {
        if (!cancelled) {
          setMessage('登录已完成，但客户端回调失败。请返回应用重试。');
        }
      }
    }

    void forwardToClient();
    return () => {
      cancelled = true;
    };
  }, [isPending, redirect, router, session?.user]);

  return (
    <div className="bg-background text-foreground flex min-h-screen items-center justify-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <Loader2 className="text-primary size-6 animate-spin" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/auth-callback')({
  component: AuthCallbackPage,
});
