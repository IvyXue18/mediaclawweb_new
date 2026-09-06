import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getLocale } from '@/paraglide/runtime.js';

type Platform = 'xiaohongshu' | 'douyin';

const STORAGE_KEY = 'mediaclaw-docs-platform-example';

interface PlatformExample {
  label: string;
  caption?: string;
  src?: string;
}

export function PlatformExampleTabs({
  xiaohongshuCaption,
  xiaohongshuCaptionEn,
  xiaohongshuSrc,
  douyinCaption,
  douyinCaptionEn,
  douyinSrc,
}: {
  xiaohongshuCaption?: string;
  xiaohongshuCaptionEn?: string;
  xiaohongshuSrc?: string;
  douyinCaption?: string;
  douyinCaptionEn?: string;
  douyinSrc?: string;
}) {
  const [platform, setPlatform] = useState<Platform>('xiaohongshu');
  const isEn = getLocale() === 'en';

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'xiaohongshu' || saved === 'douyin') setPlatform(saved);
  }, []);

  const selectPlatform = (next: Platform) => {
    setPlatform(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const examples: Record<Platform, PlatformExample> = {
    xiaohongshu: {
      label: isEn ? 'Xiaohongshu example' : '小红书示例',
      caption: isEn
        ? (xiaohongshuCaptionEn ?? xiaohongshuCaption)
        : xiaohongshuCaption,
      src: xiaohongshuSrc,
    },
    douyin: {
      label: isEn ? 'Douyin example' : '抖音示例',
      caption: isEn ? (douyinCaptionEn ?? douyinCaption) : douyinCaption,
      src: douyinSrc,
    },
  };
  const current = examples[platform];

  return (
    <section className="my-6">
      <div
        className="border-border mb-3 flex gap-5 border-b"
        role="tablist"
        aria-label="切换平台示例"
      >
        {(Object.keys(examples) as Platform[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={platform === key}
            onClick={() => selectPlatform(key)}
            className={cn(
              'relative pb-2 text-sm font-medium transition-colors',
              platform === key
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {examples[key].label}
            {platform === key ? (
              <span className="bg-primary absolute inset-x-0 -bottom-px mx-auto h-0.5 w-6 rounded-full" />
            ) : null}
          </button>
        ))}
      </div>
      {current.src ? (
        <figure>
          <img
            src={current.src}
            alt={current.caption || current.label}
            loading="lazy"
            className="border-border w-full rounded-lg border"
          />
          {current.caption ? (
            <figcaption className="text-muted-foreground mt-2 text-center text-xs">
              {current.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : (
        <div className="bg-muted/20 border-border text-muted-foreground flex min-h-52 flex-col items-center justify-center gap-2 rounded-lg border p-6 text-center text-sm">
          <ImageIcon className="size-6" />
          <span>
            {current.caption ||
              (isEn
                ? `${current.label} screenshot pending`
                : `${current.label}截图待补充`)}
          </span>
        </div>
      )}
    </section>
  );
}
