import { useEffect, useRef, useState } from 'react';

import { usePathname } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3 | 4;
  /** 1-based position inside a <Steps> block, so the sidebar shows the same
   * numbers as the numbered rail in the article. Absent for plain headings. */
  step?: number;
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
      // Step headings live inside a <Steps> wrapper and are numbered by a CSS
      // counter in the article, not in the heading text — count them off the
      // DOM here so the sidebar and the article agree without the MDX having
      // to hand-type "1." into every heading.
      const stepCounts = new Map<Element, number>();
      const nextItems: TocItem[] = headings.map((heading) => {
        const stepsRoot =
          heading.tagName === 'H3' ? heading.closest('[data-steps]') : null;
        let step: number | undefined;
        if (stepsRoot) {
          step = (stepCounts.get(stepsRoot) ?? 0) + 1;
          stepCounts.set(stepsRoot, step);
        }
        return {
          id: heading.id,
          text: heading.textContent?.replace(/\s*#\s*$/, '') ?? '',
          level:
            heading.tagName === 'H4' ? 4 : heading.tagName === 'H3' ? 3 : 2,
          step,
        };
      });

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
          <ul className="border-border flex flex-col border-l">
            {items.map((item, index) => {
              const isActive = activeId === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={cn(
                      '-ml-px flex items-start gap-1.5 border-l-2 py-1 pl-3 transition-colors',
                      // h2s are the page's chapters: heavier, with air above
                      // so the flat list reads as grouped sections instead of
                      // one long paragraph of links.
                      item.level === 2 &&
                        'text-foreground/80 text-[13px] font-semibold',
                      item.level === 2 && index > 0 && 'mt-3',
                      item.level === 3 && 'pl-6 text-[13px]',
                      item.level === 4 && 'pl-9 text-[13px]',
                      isActive
                        ? 'border-primary text-primary font-medium'
                        : cn(
                            'hover:text-foreground border-transparent',
                            item.level === 2
                              ? 'text-foreground/80'
                              : 'text-muted-foreground'
                          )
                    )}
                  >
                    {item.step ? (
                      <span
                        className={cn(
                          'mt-[3px] inline-flex size-4 shrink-0 items-center justify-center rounded text-[10px] font-semibold tabular-nums',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {item.step}
                      </span>
                    ) : null}
                    {/* Chinese headings wrap to three lines in a 224px rail;
                        clamping keeps every entry scannable at a glance. */}
                    <span className="line-clamp-2 leading-5">{item.text}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
