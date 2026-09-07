type VideoPosterMap = {
  sourceIncludes: string;
  posters: Record<number, string>;
};

// Keep complete URLs visible to the build's image validation/versioning pass.
const demoVideoPosters: Record<number, string> = {
  0: '/imgs/video-posters/mediaclaw-demo-20260424-t000.webp',
  4: '/imgs/video-posters/mediaclaw-demo-20260424-t004.webp',
  8: '/imgs/video-posters/mediaclaw-demo-20260424-t008.webp',
  39: '/imgs/video-posters/mediaclaw-demo-20260424-t039.webp',
  45: '/imgs/video-posters/mediaclaw-demo-20260424-t045.webp',
  134: '/imgs/video-posters/mediaclaw-demo-20260424-t134.webp',
  137: '/imgs/video-posters/mediaclaw-demo-20260424-t137.webp',
  180: '/imgs/video-posters/mediaclaw-demo-20260424-t180.webp',
  222: '/imgs/video-posters/mediaclaw-demo-20260424-t222.webp',
  232: '/imgs/video-posters/mediaclaw-demo-20260424-t232.webp',
  291: '/imgs/video-posters/mediaclaw-demo-20260424-t291.webp',
};

const staticVideoPosters: VideoPosterMap[] = [
  {
    sourceIncludes: '/videos/mediaclaw-demo-20260424.mp4',
    posters: demoVideoPosters,
  },
];

export const videoPosterSizes: Record<
  string,
  { width: number; height: number }
> = Object.fromEntries(
  Object.values(demoVideoPosters).map((src) => [
    src,
    { width: 1360, height: 880 },
  ])
);

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' || value.trim() === '') return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseVideoMediaFragment(url?: string): {
  start?: number;
  end?: number;
} {
  if (!url) return {};

  const match = url.match(/#t=([0-9.]+)(?:,([0-9.]+))?/);
  if (!match) return {};

  return {
    start: readNumber(match[1]),
    end: readNumber(match[2]),
  };
}

export function stripVideoMediaFragment(url: string): string {
  return url.replace(/#t=[^#?&]*/, '');
}

export function resolveStaticVideoPoster(
  src?: string | null,
  startOverride?: number
): string | undefined {
  if (!src) return undefined;

  const base = stripVideoMediaFragment(src);
  const config = staticVideoPosters.find((item) =>
    base.includes(item.sourceIncludes)
  );
  if (!config) return undefined;

  const fragment = parseVideoMediaFragment(src);
  const start = Math.max(0, Math.floor(startOverride ?? fragment.start ?? 0));

  return config.posters[start];
}
