import { Download } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { HeaderAuthAction } from '@/blocks/header';
import { LocaleSelector } from '@/components/locale-selector';
import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';

// Deliberately not the marketing site's floating pill Header — a plain
// sticky bar so it reserves its own layout space (no compensating top
// padding needed downstream) and stays visually pinned while scrolling.
export function DocsHeader() {
  return (
    <header className="border-border/60 bg-background/95 sticky top-0 z-40 w-full border-b backdrop-blur-lg">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:h-16 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          {envConfigs.app_logo ? (
            <img
              src={envConfigs.app_logo}
              alt={envConfigs.app_name}
              width={32}
              height={32}
              decoding="async"
              className="size-7 rounded-lg lg:size-8"
            />
          ) : null}
          <span className="text-base font-semibold tracking-normal lg:text-lg">
            {envConfigs.app_name}
          </span>
          <span className="border-border/60 text-muted-foreground rounded-full border px-2 py-0.5 text-xs font-medium">
            {m['docs.header.badge']()}
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
          <Link
            href="/download"
            data-docs-download-link
            aria-label={m['docs.header.download']()}
            className={buttonVariants({
              size: 'lg',
              className: 'rounded-full px-3 sm:px-4',
            })}
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">
              {m['docs.header.download']()}
            </span>
          </Link>
          <ThemeToggle />
          <LocaleSelector />
          <div className="border-border/60 border-l pl-1.5 sm:pl-2 lg:pl-3">
            <HeaderAuthAction loginClassName="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors" />
          </div>
        </div>
      </div>
    </header>
  );
}
