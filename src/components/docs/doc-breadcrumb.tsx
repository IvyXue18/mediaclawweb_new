import { Link } from '@/core/i18n/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { DocBreadcrumbItem } from '@/content/docs/registry';

export function DocBreadcrumb({ trail }: { trail: DocBreadcrumbItem[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <span key={`${item.label}-${index}`} className="contents">
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link href={item.href}>{item.label}</Link>}
                  />
                )}
              </BreadcrumbItem>
              {!isLast ? <BreadcrumbSeparator /> : null}
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
