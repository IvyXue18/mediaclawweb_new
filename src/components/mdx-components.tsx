import {
  isValidElement,
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
  type VideoHTMLAttributes,
} from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  Film,
  ImageIcon,
  Info,
  Lightbulb,
  Link as LinkIcon,
  MessageSquareWarning,
  OctagonAlert,
  X,
  ZoomIn,
} from 'lucide-react';
import type { MDXComponents } from 'mdx/types';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { resolveStaticVideoPoster } from '@/lib/video-posters';
import { getLocale } from '@/paraglide/runtime.js';
import { PlatformExampleTabs } from '@/components/docs/platform-example-tabs';

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

// Fenced code blocks (```prompt text```) can run to hundreds of lines — capping
// the height and scrolling internally keeps a long prompt from stretching the
// article, while the copy button makes it usable as a copy/paste source.
function CodeBlock({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = preRef.current?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="group/code relative my-6">
      <button
        type="button"
        onClick={handleCopy}
        aria-label="复制"
        className="border-border bg-background/90 text-muted-foreground hover:text-foreground absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs opacity-0 backdrop-blur transition-opacity group-hover/code:opacity-100 focus-visible:opacity-100"
      >
        {copied ? (
          <>
            <Check className="size-3.5" />
            已复制
          </>
        ) : (
          <>
            <Copy className="size-3.5" />
            复制
          </>
        )}
      </button>
      <pre
        ref={preRef}
        className={cn(
          'border-border bg-muted/40 text-foreground/90 max-h-[420px] overflow-auto rounded-xl border p-4 font-mono text-sm leading-6 whitespace-pre-wrap',
          className
        )}
        {...props}
      >
        {children}
      </pre>
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

// Screenshots of full app or browser windows are captured 2-3x wider than the
// article column, so at rest their UI text renders only a few pixels tall —
// enough to follow the layout, not enough to read a button label. That is the
// single most common reason a reader has to ask "which button?", so every doc
// image opens at viewport size on click instead of forcing a browser zoom.
function ZoomableImage({
  src,
  alt,
  width,
  height,
  className,
  style,
  zoom = true,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
  zoom?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    // The overlay covers the page; let it own scrolling while it is up.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const image = (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      width={width}
      height={height}
      className={className}
      style={style}
    />
  );

  if (!zoom) return image;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={alt ? `放大查看：${alt}` : '放大查看'}
        className="group/zoom relative mx-auto block w-full cursor-zoom-in appearance-none border-0 bg-transparent p-0 text-left"
        style={style?.maxWidth ? { maxWidth: style.maxWidth } : undefined}
      >
        {image}
        <span className="bg-background/85 text-muted-foreground border-border pointer-events-none absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[11px] opacity-0 backdrop-blur transition-opacity group-hover/zoom:opacity-100 group-focus-visible/zoom:opacity-100">
          <ZoomIn className="size-3.5" />
          点击放大
        </span>
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt || '放大查看图片'}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center overflow-auto bg-black/85 p-4 sm:p-8"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="关闭"
            className="absolute top-4 right-4 inline-flex size-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[92vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
          />
        </div>
      ) : null}
    </>
  );
}

// Fixed display widths so a page reads as one system instead of a ragged stack
// of whatever each screenshot happened to be captured at. `full` is the default
// for window-sized captures; the smaller steps are for panel and dialog crops.
const DOC_IMAGE_MAX_WIDTH = {
  sm: 380,
  md: 560,
  lg: 720,
  full: undefined,
} as const;

export type DocImageSize = keyof typeof DOC_IMAGE_MAX_WIDTH;

// Optional deep-dives (provider sign-up flows, verification walkthroughs) that
// most readers already know how to do. Collapsed they cost one line instead of
// half a screen of screenshots, and the content is still in the DOM for search.
function Details({
  summary,
  children,
}: {
  summary: string;
  children?: ReactNode;
}) {
  return (
    // Tinted with the brand accent rather than the neutral surface: collapsed,
    // this is the only thing on the page a reader has to click to reveal
    // content, so it must not read as another paragraph of body text.
    <details className="group/details border-primary/30 bg-primary/[0.05] dark:bg-primary/12 my-5 rounded-xl border">
      <summary className="text-primary hover:bg-primary/10 flex cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors select-none marker:content-none [&::-webkit-details-marker]:hidden">
        <ImageIcon className="size-4 shrink-0" />
        {summary}
        <ChevronDown className="ml-auto size-4 shrink-0 transition-transform [[open]_&]:rotate-180" />
      </summary>
      <div className="border-primary/20 border-t px-4 pt-1 pb-4">
        {children}
      </div>
    </details>
  );
}

// Numbered how-to sequence. Plain `### 标题` headings stay inside — the number
// badge and rail come from CSS counters (.doc-steps in globals.css), so a step
// can be inserted or reordered without renumbering prose or breaking the
// heading ids that deep links and the TOC rely on. `data-steps` is the hook
// DocToc reads to number the matching entries in the sidebar.
function Steps({ children }: { children?: ReactNode }) {
  return (
    <div data-steps className="doc-steps">
      {children}
    </div>
  );
}

export const mdxComponents: MDXComponents = {
  Callout,
  Details,
  Steps,
  PlatformExampleTabs,
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
      className={cn(
        'text-foreground/85 px-4 py-3 leading-6 first:whitespace-nowrap',
        className
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }: HTMLAttributes<HTMLElement>) => {
    // Fenced code blocks (```lang) hand the language down as a
    // `language-xxx` className on this inner <code> — the `pre` override
    // above already supplies the block's background/border, so skip the
    // inline-code pill styling here to avoid nesting two backgrounds.
    if (/language-/.test(className ?? '')) {
      return <code className={className} {...props} />;
    }
    return (
      <code
        className={cn(
          'bg-muted text-foreground rounded px-[0.4rem] py-[0.2rem] font-mono text-sm',
          className
        )}
        {...props}
      />
    );
  },
  pre: CodeBlock,
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
    size,
    frame = true,
    zoom = true,
  }: {
    src: string;
    alt?: string;
    caption?: string;
    captionEn?: string;
    // Intrinsic pixel size of the file (`sips -g pixelWidth -g pixelHeight
    // <file>`) — reserves the right box before the image downloads. When
    // `size` is omitted these also act as the display cap, which is the
    // legacy behaviour the rest of the docs still rely on.
    width?: number;
    height?: number;
    // Preferred over a hand-picked `width` cap: snaps the image to the shared
    // size scale so a page has three image widths instead of a dozen.
    size?: DocImageSize;
    // Some screenshots (floating panels/dialogs) already have their own
    // rounded corners + shadow baked into the image, with a transparent
    // surrounding background. Adding our own border+rounded box around
    // those doubles up the corner radius, so frame={false} skips it and
    // just centers the image at its natural shape.
    frame?: boolean;
    // Turn off click-to-enlarge for images that are already legible at rest
    // (a single button, a one-line warning) where the overlay adds nothing.
    zoom?: boolean;
  }) => {
    const text = getLocale() === 'en' ? (captionEn ?? caption) : caption;
    const maxWidth = size ? DOC_IMAGE_MAX_WIDTH[size] : undefined;
    return (
      <figure className="my-6">
        <ZoomableImage
          src={src}
          alt={alt || text || ''}
          width={width}
          height={height}
          zoom={zoom}
          // With `size`, the image fills its (capped) box, so every image on
          // the page lands on one of a few widths. Without it, the legacy
          // path: no `w-full` and no inline maxWidth, so the width/height
          // attributes act as a low-specificity cap that `max-w-full` still
          // overrides down to the column — a small screenshot stays small, a
          // window-sized one is capped to the column.
          className={cn(
            size ? 'h-auto w-full' : 'mx-auto max-w-full',
            frame && 'border-border rounded-xl border'
          )}
          style={maxWidth ? { maxWidth } : undefined}
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
            <ZoomableImage
              src={image.src}
              alt={image.alt || text || ''}
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
