import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
  VideoHTMLAttributes,
} from 'react';
import type { MDXComponents } from 'mdx/types';

import { cn } from '@/lib/utils';
import { resolveStaticVideoPoster } from '@/lib/video-posters';
import { getLocale } from '@/paraglide/runtime.js';

export const mdxComponents: MDXComponents = {
  h1: ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      className={cn(
        'text-foreground mt-6 mb-2 text-xl font-semibold tracking-tight md:text-2xl',
        className
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className={cn(
        'text-foreground mt-6 mb-2 text-lg font-semibold tracking-tight md:text-xl',
        className
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className={cn(
        'text-foreground mt-4 mb-1.5 text-base font-semibold tracking-tight',
        className
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className={cn('text-foreground/90 mt-2 leading-7', className)}
      {...props}
    />
  ),
  a: ({ className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className={cn(
        'text-primary font-medium underline-offset-4 hover:underline',
        className
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }: HTMLAttributes<HTMLUListElement>) => (
    <ul
      className={cn(
        'marker:text-muted-foreground mt-2 ml-6 list-disc space-y-1',
        className
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }: HTMLAttributes<HTMLOListElement>) => (
    <ol
      className={cn(
        'marker:text-muted-foreground mt-2 ml-6 list-decimal space-y-1',
        className
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }: HTMLAttributes<HTMLLIElement>) => (
    <li className={cn('text-foreground/90 leading-7', className)} {...props} />
  ),
  strong: ({ className, ...props }: HTMLAttributes<HTMLElement>) => (
    <strong
      className={cn('text-foreground font-semibold', className)}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }: HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className={cn(
        'border-border text-muted-foreground my-4 border-l-2 pl-4 italic',
        className
      )}
      {...props}
    />
  ),
  table: ({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) => (
    <div className="border-border my-5 overflow-x-auto rounded-lg border">
      <table
        className={cn(
          'w-full min-w-[640px] border-collapse text-sm',
          className
        )}
        {...props}
      />
    </div>
  ),
  thead: ({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className={cn('bg-muted/60', className)} {...props} />
  ),
  tbody: ({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className={cn('divide-border/70 divide-y', className)} {...props} />
  ),
  tr: ({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
    <tr
      className={cn('border-border/70 border-b last:border-0', className)}
      {...props}
    />
  ),
  th: ({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className={cn(
        'text-foreground px-4 py-3 text-left font-semibold whitespace-nowrap',
        className
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      className={cn('text-foreground/85 px-4 py-3 leading-6', className)}
      {...props}
    />
  ),
  code: ({ className, ...props }: HTMLAttributes<HTMLElement>) => (
    <code
      className={cn(
        'bg-muted text-foreground rounded px-[0.4rem] py-[0.2rem] font-mono text-sm',
        className
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }: HTMLAttributes<HTMLHRElement>) => (
    <hr className={cn('border-border my-8', className)} {...props} />
  ),
  DocImage: ({
    src,
    alt,
    caption,
    captionEn,
    width,
    height,
    frame = true,
  }: {
    src: string;
    alt?: string;
    caption?: string;
    captionEn?: string;
    width?: number;
    height?: number;
    frame?: boolean;
  }) => {
    const text = getLocale() === 'en' ? (captionEn ?? caption) : caption;

    return (
      <figure className="my-6">
        <img
          src={src}
          alt={alt || text || ''}
          loading="lazy"
          width={width}
          height={height}
          style={width ? { maxWidth: `${width}px` } : undefined}
          className={cn(
            'mx-auto max-w-full',
            frame && 'border-border rounded-xl border'
          )}
        />
        {text ? (
          <figcaption className="text-muted-foreground mt-2 text-center text-xs">
            {text}
          </figcaption>
        ) : null}
      </figure>
    );
  },
  Video: ({
    className,
    poster,
    src,
    ...props
  }: VideoHTMLAttributes<HTMLVideoElement>) => (
    <video
      className={cn(
        'border-border my-6 aspect-video w-full rounded-xl border bg-black object-contain',
        className
      )}
      controls
      preload="metadata"
      playsInline
      poster={
        poster ||
        (typeof src === 'string' ? resolveStaticVideoPoster(src) : undefined)
      }
      src={src}
      {...props}
    />
  ),
};
