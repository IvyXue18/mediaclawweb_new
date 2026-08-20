import { Link } from '@/core/i18n/navigation';
import { getIndexSections, pageTypeLabels } from '@/content/docs/registry';

// Renders the flat cross-reference for the "全部功能索引" page directly
// from the registry — this list must never duplicate tutorial prose, only
// link out (plan section 2, [索引] page type).
export function DocIndexList() {
  const sections = getIndexSections();

  return (
    <div className="mt-6 flex flex-col gap-8">
      {sections.map((section) => (
        <div key={section.label}>
          <h2 className="text-foreground mb-3 text-lg font-semibold tracking-tight">
            {section.label}
          </h2>
          <div className="border-border divide-border divide-y overflow-hidden rounded-lg border">
            {section.entries.map((entry) => (
              <Link
                key={entry.slug}
                href={`/docs/${entry.slug}`}
                className="hover:bg-muted/50 flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors"
              >
                <span className="text-foreground font-medium">
                  {entry.navTitle}
                </span>
                <span className="text-muted-foreground flex shrink-0 items-center gap-3 text-xs">
                  <span className="border-border rounded border px-1.5 py-0.5">
                    {pageTypeLabels[entry.pageType]}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
