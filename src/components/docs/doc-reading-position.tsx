import { useEffect, useRef, useState } from 'react';
import { ArrowUp, X } from 'lucide-react';

import { usePathname } from '@/core/i18n/navigation';

// Router scroll restoration only covers back/forward — it keys positions by
// history entry, so returning to a page by clicking a nav link is a brand-new
// entry with nothing to restore and lands at the top. On a 15,000px tutorial
// that people read in "do a step, go do it, come back" bursts, that loses their
// place every time. This remembers the position per page for the session and
// puts them back, with a one-click undo so an intentional "start over" is never
// hijacked.
const STORAGE_PREFIX = 'docs-reading-position:';
// Below this there is nothing worth restoring — and it keeps a stray near-top
// reading from erasing a real position.
const MIN_POSITION = 400;
// If the router already restored (back/forward), it will have moved us well
// past the top by the time we look.
const ALREADY_RESTORED = 100;
const NOTICE_TIMEOUT_MS = 6000;

function readPosition(key: string): number {
  try {
    return Number(sessionStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

export function DocReadingPosition() {
  const pathname = usePathname();
  const [restored, setRestored] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  useEffect(() => {
    const key = `${STORAGE_PREFIX}${pathname}`;
    let latest = window.scrollY;
    let frame = 0;

    const persist = (value: number) => {
      try {
        if (value < MIN_POSITION) sessionStorage.removeItem(key);
        else sessionStorage.setItem(key, String(value));
      } catch {
        // Private mode / storage disabled — reading position is a nicety.
      }
    };

    const onScroll = () => {
      latest = window.scrollY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        persist(latest);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const saved = readPosition(key);
    // An explicit #anchor is a stronger intent than "where I left off".
    const hasHash = Boolean(window.location.hash);
    let restoreFrame = 0;
    let attempts = 0;

    if (saved >= MIN_POSITION && !hasHash) {
      // Images are lazy and the article is long, so the document may not be
      // tall enough to hold `saved` yet on the first frames. Wait for the
      // height, then restore — but bail out if the router's own back/forward
      // restoration already put us there.
      const tryRestore = () => {
        restoreFrame = 0;
        if (window.scrollY > ALREADY_RESTORED) return;
        const maxScroll =
          document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll >= saved || attempts > 60) {
          const target = Math.min(saved, Math.max(maxScroll, 0));
          if (target >= MIN_POSITION) {
            window.scrollTo({ top: target, behavior: 'auto' });
            latest = target;
            setRestored(true);
            dismissTimer.current = setTimeout(
              () => setRestored(false),
              NOTICE_TIMEOUT_MS
            );
          }
          return;
        }
        attempts += 1;
        restoreFrame = requestAnimationFrame(tryRestore);
      };
      restoreFrame = requestAnimationFrame(tryRestore);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
      if (restoreFrame) cancelAnimationFrame(restoreFrame);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      setRestored(false);
      // `latest` rather than window.scrollY: by the time this cleanup runs on a
      // route change the router may already have reset the window to 0.
      persist(latest);
    };
  }, [pathname]);

  const backToTop = () => {
    try {
      sessionStorage.removeItem(`${STORAGE_PREFIX}${pathname}`);
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    setRestored(false);
  };

  if (!restored) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
    >
      <div className="border-border bg-background/95 flex items-center gap-1 rounded-full border py-1.5 pr-1.5 pl-4 text-sm shadow-lg backdrop-blur">
        <span className="text-muted-foreground">已回到上次阅读位置</span>
        <button
          type="button"
          onClick={backToTop}
          className="text-primary hover:bg-primary/10 ml-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors"
        >
          <ArrowUp className="size-3.5" />
          回到顶部
        </button>
        <button
          type="button"
          onClick={() => setRestored(false)}
          aria-label="关闭"
          className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-7 items-center justify-center rounded-full transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
