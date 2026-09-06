import { useEffect, useRef } from 'react';
import {
  Archive,
  ChevronRight,
  Database,
  Filter,
  Flame,
  HelpCircle,
  History,
  House,
  Layers,
  LifeBuoy,
  ListTree,
  LogIn,
  MessageCircle,
  PenTool,
  Route,
  Search,
  Send,
  Sparkles,
  Table2,
  Target,
  UserCheck,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  docGroups,
  findActiveSubgroupId,
  type DocNavEntry,
} from '@/content/docs/registry';

const docNavIconMap: Record<string, LucideIcon> = {
  Archive,
  Database,
  Filter,
  Flame,
  HelpCircle,
  History,
  House,
  Layers,
  LifeBuoy,
  ListTree,
  LogIn,
  MessageCircle,
  PenTool,
  Route,
  Search,
  Send,
  Sparkles,
  Table2,
  Target,
  UserCheck,
  Wrench,
  Zap,
};

function DocNavIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  const Icon = name ? docNavIconMap[name] : undefined;
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}

// "Chapter" rows are the top-level entries directly under a group divider —
// they get an icon and heavier weight. "Section" rows are the pages nested
// inside an expanded chapter — indented and without an icon.
function NavEntryLink({
  entry,
  activeSlug,
  onNavigate,
  variant = 'section',
}: {
  entry: DocNavEntry;
  activeSlug: string;
  onNavigate?: () => void;
  variant?: 'chapter' | 'section';
}) {
  const href = entry.kind === 'page' ? `/docs/${entry.slug}` : entry.href;
  const isActive =
    (entry.kind === 'page' && entry.slug === activeSlug) ||
    (entry.kind === 'link' && entry.href === '/docs' && activeSlug === '');
  const icon = 'icon' in entry ? entry.icon : undefined;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex items-start gap-2.5 rounded-lg no-underline transition-colors',
        variant === 'chapter'
          ? 'px-2.5 py-2 text-sm font-medium'
          : 'px-2.5 py-1.5 text-[13.5px] leading-snug',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-foreground/70 hover:bg-muted/70 hover:text-foreground'
      )}
    >
      {variant === 'chapter' ? (
        <DocNavIcon
          name={icon}
          className={cn(
            'mt-0.5 size-4 shrink-0',
            isActive ? 'text-primary' : 'text-foreground/45'
          )}
        />
      ) : null}
      <span className="min-w-0 break-words">{entry.navTitle}</span>
    </Link>
  );
}

// Shared nav tree rendered by both the desktop sidebar and the mobile
// drawer — keeps the two surfaces from drifting apart.
export function DocNavList({
  activeSlug,
  onNavigate,
}: {
  activeSlug: string;
  onNavigate?: () => void;
}) {
  const activeSubgroupId = findActiveSubgroupId(activeSlug);
  const subgroupRefs = useRef(new Map<string, HTMLDetailsElement>());

  useEffect(() => {
    if (!activeSubgroupId) return;
    const activeDetails = subgroupRefs.current.get(activeSubgroupId);
    if (activeDetails) activeDetails.open = true;
  }, [activeSubgroupId]);

  return (
    <nav className="flex flex-col gap-8">
      {docGroups.map((group) => (
        <div key={group.id}>
          <div className="mb-2 px-2.5">
            <p className="text-foreground text-xs font-semibold tracking-wide">
              {group.label}
            </p>
          </div>
          {group.items ? (
            <div className="flex flex-col gap-1">
              {group.items.map((entry) => (
                <NavEntryLink
                  key={entry.kind === 'page' ? entry.slug : entry.href}
                  entry={entry}
                  activeSlug={activeSlug}
                  onNavigate={onNavigate}
                  variant="chapter"
                />
              ))}
            </div>
          ) : null}
          {group.subgroups ? (
            <div className="flex flex-col gap-1">
              {group.subgroups.map((subgroup) => (
                <details
                  key={subgroup.id}
                  ref={(node) => {
                    if (node) subgroupRefs.current.set(subgroup.id, node);
                    else subgroupRefs.current.delete(subgroup.id);
                  }}
                  className="group/details"
                >
                  <summary className="text-foreground/70 hover:bg-muted/70 hover:text-foreground flex cursor-pointer list-none items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors select-none [&::-webkit-details-marker]:hidden">
                    <span className="flex min-w-0 items-start gap-2.5">
                      <DocNavIcon
                        name={subgroup.icon}
                        className="text-foreground/45 mt-0.5 size-4 shrink-0"
                      />
                      <span className="min-w-0 break-words">
                        {subgroup.label}
                      </span>
                    </span>
                    <ChevronRight className="text-foreground/45 mt-0.5 size-4 shrink-0 transition-transform group-open/details:rotate-90" />
                  </summary>
                  <div className="pb-1">
                    <div className="border-border/70 ml-[1.125rem] flex flex-col gap-0.5 border-l py-1 pl-3">
                      {subgroup.items.map((entry) => (
                        <NavEntryLink
                          key={entry.slug}
                          entry={entry}
                          activeSlug={activeSlug}
                          onNavigate={onNavigate}
                          variant="section"
                        />
                      ))}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </nav>
  );
}
