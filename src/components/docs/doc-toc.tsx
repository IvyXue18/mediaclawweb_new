import { useEffect, useRef, useState } from 'react';

import { usePathname } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3 | 4;
}

// Scans the rendered #doc-content headings and scroll-spies via
// IntersectionObserver. During client navigation the layout effect can run
// before the nested MDX route has committed its new content, so also watch the
// content node and rebuild the TOC when its headings change.
export function DocToc({ className }: { className?: string }) {
  const pathname = usePathname();
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState('');
  const visibleIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let headingObserver: IntersectionObserver | undefined;

    const rebuildToc = () => {
      headingObserver?.disconnect();

      const container = document.getElementById('doc-content');
      if (!container) {
        setItems([]);
        setActiveId('');
        return;
      }

      const headings = Array.from(
        container.querySelectorAll<HTMLElement>('h2, h3, h4')
      ).filter((heading) => heading.id);
      const nextItems: TocItem[] = headings.map((heading) => ({
        id: heading.id,
        text: heading.textContent?.replace(/\s*#\s*$/, '') ?? '',
        level: heading.tagName === 'H4' ? 4 : heading.tagName === 'H3' ? 3 : 2,
      }));

      setItems(nextItems);
      visibleIds.current = new Set();
      setActiveId(nextItems[0]?.id ?? '');

      if (headings.length === 0) return;

      headingObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visibleIds.current.add(entry.target.id);
            else visibleIds.current.delete(entry.target.id);
          }
          const firstVisible = nextItems.find((item) =>
            visibleIds.current.has(item.id)
          );
          if (firstVisible) setActiveId(firstVisible.id);
        },
        { rootMargin: '-100px 0px -70% 0px' }
      );
      headings.forEach((heading) => headingObserver?.observe(heading));
    };

    rebuildToc();

    const isDocContentMutation = (node: Node) => {
      const element = node instanceof Element ? node : node.parentElement;
      return Boolean(
        element?.matches('#doc-content, #doc-content *') ||
        element?.querySelector('#doc-content')
      );
    };
    const contentObserver = new MutationObserver((mutations) => {
      const contentChanged = mutations.some(
        (mutation) =>
          isDocContentMutation(mutation.target) ||
          Array.from(mutation.addedNodes).some(isDocContentMutation) ||
          Array.from(mutation.removedNodes).some(isDocContentMutation)
      );
      if (contentChanged) rebuildToc();
    });
    contentObserver.observe(document.querySelector('main') ?? document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // The nested route may commit after this effect during client navigation.
    // Rechecking on the next frame covers that commit even if React replaced
    // the observed content node instead of updating its children.
    const frame = window.requestAnimationFrame(rebuildToc);

    return () => {
      window.cancelAnimationFrame(frame);
      contentObserver.disconnect();
      headingObserver?.disconnect();
    };
  }, [pathname]);

  // Always render the w-56 flex sibling, even before headings are scanned —
  // otherwise the content column briefly has no TOC to share width with on
  // first paint, then jumps narrower (images flash oversized) once the
  // client effect above populates `items` a beat later.
  return (
    <aside className={cn('w-56 shrink-0', className)}>
      {items.length > 0 ? (
        <div className="doc-scroll sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-6 pl-5">
          <p className="text-muted-foreground/80 mb-3 text-xs font-semibold tracking-wide uppercase">
            本页目录
          </p>
          <ul className="border-border flex flex-col gap-0.5 border-l">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={cn(
                    '-ml-px block border-l-2 py-1 pl-3 text-sm transition-colors',
                    item.level === 3 && 'pl-6',
                    item.level === 4 && 'pl-9',
                    activeId === item.id
                      ? 'border-primary text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground border-transparent'
                  )}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
