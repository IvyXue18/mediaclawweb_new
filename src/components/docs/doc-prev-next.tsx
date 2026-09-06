import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import type { DocPrevNext } from '@/content/docs/registry';

export function DocPrevNext({ prev, next }: DocPrevNext) {
  if (!prev && !next) return null;

  return (
    <nav className="border-border mt-10 grid grid-cols-1 gap-3 border-t pt-6 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`/docs/${prev.slug}`}
          className="border-border hover:border-primary/40 hover:bg-muted/50 flex flex-col gap-1 rounded-lg border p-4 transition-colors"
        >
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <ArrowLeft className="size-3.5" />
            上一步
          </span>
          <span className="text-foreground text-sm font-medium">
            {prev.navTitle}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/docs/${next.slug}`}
          className="border-border hover:border-primary/40 hover:bg-muted/50 flex flex-col items-end gap-1 rounded-lg border p-4 text-right transition-colors sm:col-start-2"
        >
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            下一步
            <ArrowRight className="size-3.5" />
          </span>
          <span className="text-foreground text-sm font-medium">
            {next.navTitle}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
