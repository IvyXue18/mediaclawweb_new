import type { ComponentType } from 'react';

import { DocBreadcrumb } from '@/components/docs/doc-breadcrumb';
import { DocIndexList } from '@/components/docs/doc-index-list';
import { DocPrevNext } from '@/components/docs/doc-prev-next';
import {
  getBreadcrumbTrail,
  getPrevNext,
  type DocLeafDef,
} from '@/content/docs/registry';

export function DocArticle({
  leaf,
  title,
  description,
  Content,
}: {
  leaf: DocLeafDef;
  title: string;
  description: string;
  Content: ComponentType;
}) {
  const trail = getBreadcrumbTrail(leaf.slug);
  const { prev, next } = getPrevNext(leaf.slug);

  return (
    <article>
      <DocBreadcrumb trail={trail} />
      <header className="border-border mt-4 mb-8 border-b pb-6">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="text-muted-foreground mt-3">{description}</p>
      </header>
      <div
        id="doc-content"
        className="text-foreground/90 text-[15px] leading-7"
      >
        <Content />
      </div>
      {leaf.pageType === 'index' ? <DocIndexList /> : null}
      <DocPrevNext prev={prev} next={next} />
    </article>
  );
}
