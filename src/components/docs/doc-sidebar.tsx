import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { DocNavList } from '@/components/docs/doc-nav-list';

const DEFAULT_SIDEBAR_WIDTH = 288;
const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 420;
const SIDEBAR_WIDTH_STORAGE_KEY = 'mediaclaw-docs-sidebar-width';

function clampSidebarWidth(width: number) {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));
}

export function DocSidebar({
  activeSlug,
  className,
}: {
  activeSlug: string;
  className?: string;
}) {
  const [width, setWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const dragStartRef = useRef<{ pointerX: number; width: number } | null>(null);

  useEffect(() => {
    const savedWidth = Number(
      window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)
    );
    if (Number.isFinite(savedWidth) && savedWidth > 0) {
      setWidth(clampSidebarWidth(savedWidth));
    }
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const dragStart = dragStartRef.current;
      if (!dragStart) return;

      const nextWidth = clampSidebarWidth(
        dragStart.width + event.clientX - dragStart.pointerX
      );
      setWidth(nextWidth);
      window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(nextWidth));
    };

    const stopDragging = () => {
      if (!dragStartRef.current) return;
      dragStartRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  const updateWidth = (nextWidth: number) => {
    const clampedWidth = clampSidebarWidth(nextWidth);
    setWidth(clampedWidth);
    window.localStorage.setItem(
      SIDEBAR_WIDTH_STORAGE_KEY,
      String(clampedWidth)
    );
  };

  return (
    <aside
      className={cn(
        'border-border/60 relative shrink-0 self-stretch border-r',
        className
      )}
      style={{ width }}
    >
      <div className="doc-scroll sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-6 pr-4 pb-10 pl-4 sm:pl-6 lg:pl-8">
        <DocNavList activeSlug={activeSlug} />
      </div>
      <button
        type="button"
        aria-label="调整目录宽度"
        aria-orientation="vertical"
        role="separator"
        title="拖动调整目录宽度"
        className="group absolute inset-y-0 -right-1 z-10 hidden w-2 cursor-col-resize touch-none lg:block"
        onPointerDown={(event) => {
          event.preventDefault();
          dragStartRef.current = {
            pointerX: event.clientX,
            width,
          };
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            updateWidth(width - 16);
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            updateWidth(width + 16);
          }
        }}
      >
        <span className="bg-border group-hover:bg-primary/60 group-focus-visible:bg-primary absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors" />
      </button>
    </aside>
  );
}
