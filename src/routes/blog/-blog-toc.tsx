import { useEffect, useState } from 'react';

import { usePathname } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';

interface BlogTocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

function headingSlug(text: string, index: number) {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || `section-${index + 1}`;
}

export function BlogToc({ title }: { title: string }) {
  const pathname = usePathname();
  const [items, setItems] = useState<BlogTocItem[]>([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const article = document.querySelector<HTMLElement>(
      '[data-blog-detail-article]'
    );
    if (!article) return;

    const usedIds = new Set<string>();
    const headings = Array.from(
      article.querySelectorAll<HTMLElement>('h2, h3')
    );
    const nextItems = headings.map((heading, index) => {
      const baseId =
        heading.id || headingSlug(heading.textContent ?? '', index);
      let id = baseId;
      let suffix = 2;
      while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
      usedIds.add(id);
      heading.id = id;

      return {
        id,
        text: heading.textContent?.trim() ?? '',
        level: heading.tagName === 'H3' ? 3 : 2,
      } satisfies BlogTocItem;
    });

    setItems(nextItems);
    setActiveId(nextItems[0]?.id ?? '');

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleHeading = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          )[0];
        if (visibleHeading) setActiveId(visibleHeading.target.id);
      },
      { rootMargin: '-96px 0px -72% 0px' }
    );
    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [pathname]);

  if (!items.length) return null;

  return (
    <nav aria-label={title} data-blog-toc>
      <p className="mb-3 text-sm font-semibold tracking-wide uppercase">
        {title}
      </p>
      <ul className="border-border space-y-0.5 border-l">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                '-ml-px block border-l-2 py-1.5 text-sm leading-5 transition-colors',
                item.level === 3 ? 'pl-6' : 'pl-3',
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
    </nav>
  );
}
