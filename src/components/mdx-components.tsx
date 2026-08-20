import {
  isValidElement,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
  type VideoHTMLAttributes,
} from 'react';
import {
  AlertTriangle,
  Film,
  ImageIcon,
  Info,
  Lightbulb,
  Link as LinkIcon,
  MessageSquareWarning,
  OctagonAlert,
} from 'lucide-react';
import type { MDXComponents } from 'mdx/types';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { resolveStaticVideoPoster } from '@/lib/video-posters';
import { getLocale } from '@/paraglide/runtime.js';

// Headings get a stable, content-derived id so the "on this page" TOC
// (DocToc) can scroll-spy and deep-link into sections without a build-time
// rehype-slug step.
function headingText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(headingText).join('');
  if (isValidElement<{ children?: ReactNode }>(node))
    return headingText(node.props.children);
  return '';
}

function slugify(node: ReactNode): string {
  return headingText(node)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

function HeadingAnchor({ id }: { id: string }) {
  return (
    <a
      href={`#${id}`}
      aria-label="复制章节链接"
      className="text-muted-foreground/0 hover:text-foreground group-hover:text-muted-foreground/70 ml-2 inline-flex align-middle transition-colors"
    >
      <LinkIcon className="size-4" />
    </a>
  );
}

const calloutStyles = {
  note: {
    icon: Info,
    className:
      'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100',
    iconClassName: 'text-blue-500 dark:text-blue-400',
  },
  tip: {
    icon: Lightbulb,
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100',
    iconClassName: 'text-emerald-500 dark:text-emerald-400',
  },
  warning: {
    icon: AlertTriangle,
    className:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100',
    iconClassName: 'text-amber-500 dark:text-amber-400',
  },
  important: {
    icon: MessageSquareWarning,
    className:
      'border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-100',
    iconClassName: 'text-purple-500 dark:text-purple-400',
  },
  danger: {
    icon: OctagonAlert,
    className:
      'border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100',
    iconClassName: 'text-red-500 dark:text-red-400',
  },
} as const;

function Callout({
  type = 'note',
  children,
}: {
  type?: keyof typeof calloutStyles;
  children?: ReactNode;
}) {
  const { icon: Icon, className, iconClassName } = calloutStyles[type];
  return (
    <div
      className={cn(
        'my-4 flex gap-3 rounded-lg border p-4 text-sm leading-6',
        className
      )}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', iconClassName)} />
      <div className="min-w-0 [&>p:first-child]:mt-0">{children}</div>
    </div>
  );
}

function MdxLink({
  className,
  href,
  target,
  rel,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const linkClassName = cn(
    'text-primary font-medium underline-offset-4 hover:underline',
    className
  );

  if (!href) {
    return <a target={target} rel={rel} className={linkClassName} {...props} />;
  }

  const isExternal = /^(?:https?:)?\/\//i.test(href);
  const isSpecialProtocol = /^(?:mailto:|tel:)/i.test(href);

  if (!isExternal && !isSpecialProtocol) {
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        className={linkClassName}
        {...props}
      />
    );
  }

  const resolvedTarget = target ?? (isExternal ? '_blank' : undefined);
  const resolvedRel =
    rel ?? (resolvedTarget === '_blank' ? 'noopener' : undefined);

  return (
    <a
      href={href}
      target={resolvedTarget}
      rel={resolvedRel}
      className={linkClassName}
      {...props}
    />
  );
}

export const mdxComponents: MDXComponents = {
  Callout,
  h1: ({
    className,
    id,
    children,
    ...props
  }: HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      id={id ?? slugify(children)}
      className={cn(
        'text-foreground mt-6 mb-2 text-xl font-semibold tracking-tight md:text-2xl',
        className
      )}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({
    className,
    id,
    children,
    ...props
  }: HTMLAttributes<HTMLHeadingElement>) => {
    const headingId = id ?? slugify(children);
    return (
      <h2
        id={headingId}
        className={cn(
          'text-foreground group mt-10 mb-3 scroll-mt-28 text-lg font-semibold tracking-tight md:text-xl',
          className
        )}
        {...props}
      >
        {children}
        <HeadingAnchor id={headingId} />
      </h2>
    );
  },
  h3: ({
    className,
    id,
    children,
    ...props
  }: HTMLAttributes<HTMLHeadingElement>) => {
    const headingId = id ?? slugify(children);
    return (
      <h3
        id={headingId}
        className={cn(
          'text-foreground group mt-6 mb-2 scroll-mt-28 text-base font-semibold tracking-tight',
          className
        )}
        {...props}
      >
        {children}
        <HeadingAnchor id={headingId} />
      </h3>
    );
  },
  h4: ({
    className,
    id,
    children,
    ...props
  }: HTMLAttributes<HTMLHeadingElement>) => {
    const headingId = id ?? slugify(children);
    return (
      <h4
        id={headingId}
        className={cn(
          'text-foreground group mt-5 mb-2 scroll-mt-28 text-sm font-semibold tracking-tight',
          className
        )}
        {...props}
      >
        {children}
        <HeadingAnchor id={headingId} />
      </h4>
    );
  },
  p: ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className={cn('text-foreground/90 mt-2 leading-7', className)}
      {...props}
    />
  ),
  a: MdxLink,
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
  mark: ({ className, ...props }: HTMLAttributes<HTMLElement>) => (
    <mark
      className={cn(
        'bg-primary/15 text-foreground rounded px-1 py-0.5',
        className
      )}
      {...props}
    />
  ),
  u: ({ className, ...props }: HTMLAttributes<HTMLElement>) => (
    <u
      className={cn('underline decoration-1 underline-offset-8', className)}
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
  kbd: ({ className, ...props }: HTMLAttributes<HTMLElement>) => (
    <kbd
      className={cn(
        'bg-muted text-foreground border-border inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-xs shadow-sm',
        className
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }: HTMLAttributes<HTMLHRElement>) => (
    <hr className={cn('border-border my-8', className)} {...props} />
  ),
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
  // Content is drafted ahead of the real screenshots/recordings — these
  // stand in the layout's place so pages ship with correct structure and
  // get swapped for real media without a re-layout.
  ImagePlaceholder: ({ caption }: { caption?: string }) => (
    <div className="border-border bg-muted/30 text-muted-foreground my-6 flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm">
      <ImageIcon className="size-6" />
      {caption ? <span className="max-w-md">{caption}</span> : null}
    </div>
  ),
  VideoPlaceholder: ({ caption }: { caption?: string }) => (
    <div className="border-border bg-muted/30 text-muted-foreground my-6 flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm">
      <Film className="size-6" />
      {caption ? <span className="max-w-md">{caption}</span> : null}
    </div>
  ),
  // Real-media counterparts of the placeholders above — same `caption` prop
  // (plus an optional `captionEn`, shown when the active locale is English),
  // swap the tag once the screenshot/recording lands in public/imgs/docs/.
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
    // Optional explicit cap (`sips -g pixelWidth -g pixelHeight <file>`) to
    // shrink a screenshot *below* its own native resolution — most images
    // don't need this, see the sizing rule below.
    width?: number;
    height?: number;
    // Some screenshots (floating panels/dialogs) already have their own
    // rounded corners + shadow baked into the image, with a transparent
    // surrounding background. Adding our own border+rounded box around
    // those doubles up the corner radius, so frame={false} skips it and
    // just centers the image at its natural shape.
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
          // No `w-full`, and no inline `maxWidth` style either — an inline
          // style would beat `max-w-full` (same CSS property, higher
          // specificity) and let the image render at its full native
          // resolution regardless of the article column's width. The
          // `width`/`height` attributes alone are a low-specificity
          // presentational hint the `max-w-full` class still overrides, so
          // images render at their own native resolution and only shrink
          // (never upscale) to fit the article column. A small focused
          // screenshot stays small; a full-width app screenshot already
          // exceeds the column and gets capped down to it either way.
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
  // Multiple screenshots shown side by side, scaled to a shared row height
  // instead of forced into equal-width columns — like Feishu/Lark's image
  // row: portrait and landscape screenshots line up at the same height with
  // their own natural (different) widths, no cropping or distortion.
  //
  // How: give every image `flex-grow: aspectRatio` with `flex-basis: 0` in
  // one flex row. Flexbox distributes the row's free width proportionally
  // to each item's grow factor, so image i gets width_i = W * ratio_i /
  // sum(ratio). Its rendered height is then width_i / ratio_i = W /
  // sum(ratio) — the same value for every image in the row, regardless of
  // its own ratio. No JS measurement, no fixed pixel height, and it stays
  // correct at any container width since it's a pure ratio.
  DocImageGrid: ({
    images,
  }: {
    images: Array<{
      src: string;
      alt?: string;
      caption?: string;
      captionEn?: string;
      // Intrinsic pixel size of the source file (`sips -g pixelWidth -g
      // pixelHeight <file>`). Drives the flex-grow ratio above, and also
      // sets the <img> width/height attributes so the browser reserves the
      // right box before the image downloads (no load-time resize flash).
      width?: number;
      height?: number;
      // See DocImage's `frame` — same escape hatch for a panel/dialog
      // screenshot with its own baked-in rounded corners + transparent bg.
      frame?: boolean;
    }>;
  }) => (
    <div className="my-6 flex flex-wrap gap-4">
      {images.map((image, index) => {
        const text =
          getLocale() === 'en'
            ? (image.captionEn ?? image.caption)
            : image.caption;
        const ratio =
          image.width && image.height ? image.width / image.height : 1;
        const frame = image.frame ?? true;
        return (
          // min-w-32 is the shrink floor: below that, images wrap to their
          // own line (as full-width single images) instead of squeezing
          // illegibly thin on narrow viewports.
          <figure
            key={image.src || index}
            className="flex min-w-32 flex-col"
            style={{ flexGrow: ratio, flexBasis: 0 }}
          >
            <img
              src={image.src}
              alt={image.alt || text || ''}
              loading="lazy"
              width={image.width}
              height={image.height}
              className={cn(
                'h-auto w-full',
                frame ? 'border-border rounded-xl border' : ''
              )}
            />
            {text ? (
              <figcaption className="text-muted-foreground mt-auto pt-2 text-center text-xs">
                {text}
              </figcaption>
            ) : null}
          </figure>
        );
      })}
    </div>
  ),
  DocVideo: ({
    src,
    caption,
    captionEn,
  }: {
    src: string;
    caption?: string;
    captionEn?: string;
  }) => {
    const text = getLocale() === 'en' ? (captionEn ?? caption) : caption;
    return (
      <figure className="my-6">
        <video
          className="border-border aspect-video w-full rounded-xl border bg-black object-contain"
          controls
          preload="metadata"
          playsInline
          poster={resolveStaticVideoPoster(src)}
          src={src}
        />
        {text ? (
          <figcaption className="text-muted-foreground mt-2 text-center text-xs">
            {text}
          </figcaption>
        ) : null}
      </figure>
    );
  },
};
