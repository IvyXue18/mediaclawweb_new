import { useEffect, useRef } from 'react';
import { useRouterState } from '@tanstack/react-router';

import { recordAnalyticsEventSafe } from '@/lib/client-analytics';

function normalizePath(path: string) {
  return path.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
}

function classifyDownloadTarget(anchor: HTMLAnchorElement) {
  const rawHref = anchor.getAttribute('href') || '';
  const href = anchor.href || rawHref;
  const lower = href.toLowerCase();

  if (lower.includes('chromewebstore.google.com')) {
    return { kind: 'chrome_store', eventName: 'chrome_store_click' };
  }
  if (lower.includes('microsoftedge.microsoft.com')) {
    return { kind: 'edge_store', eventName: 'download_click' };
  }
  if (
    anchor.hasAttribute('data-download-card-button') ||
    lower.includes('/download') ||
    lower.includes('/downloads/') ||
    lower.endsWith('.crx')
  ) {
    return { kind: 'download', eventName: 'download_click' };
  }

  return null;
}

export function FirstPartyAnalytics() {
  const locationKey = useRouterState({
    select: (state) => {
      const location = state.location as {
        href?: string;
        pathname: string;
        searchStr?: string;
        hash?: string;
      };
      return (
        location.href ||
        `${location.pathname}${location.searchStr || ''}${location.hash || ''}`
      );
    },
  });
  const lastPagePathRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pagePath = `${window.location.pathname}${window.location.search}`;
    if (lastPagePathRef.current === pagePath) return;
    lastPagePathRef.current = pagePath;

    recordAnalyticsEventSafe('page_view', {
      title: document.title,
      path: normalizePath(window.location.pathname),
    });

    if (normalizePath(window.location.pathname) === '/pricing') {
      const params = new URLSearchParams(window.location.search);
      recordAnalyticsEventSafe('pricing_view', {
        source: params.get('source') || undefined,
        entry: params.get('entry') || undefined,
        feature: params.get('feature') || undefined,
        intent: params.get('intent') || undefined,
      });
    }
  }, [locationKey]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const downloadTarget = classifyDownloadTarget(anchor);
      if (!downloadTarget) return;

      const params = new URLSearchParams(window.location.search);
      const payload = {
        targetUrl: anchor.href || anchor.getAttribute('href') || '',
        label: anchor.textContent?.trim().slice(0, 120) || undefined,
        kind: downloadTarget.kind,
        pagePath: `${window.location.pathname}${window.location.search}`,
        source: params.get('source') || undefined,
        entry: params.get('entry') || undefined,
      };

      recordAnalyticsEventSafe(downloadTarget.eventName, payload);
      if (downloadTarget.eventName === 'chrome_store_click') {
        recordAnalyticsEventSafe('download_click', payload);
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
