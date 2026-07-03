type VideoPosterMap = {
  sourceIncludes: string;
  posters: Record<number, string>;
};

const demoVideoPosterBase = '/imgs/video-posters/mediaclaw-demo-20260424';

function demoPoster(tag: string): string {
  return `${demoVideoPosterBase}-${tag}.webp`;
}

const demoVideoPosters: Record<number, string> = {
  0: demoPoster('t000'),
  4: demoPoster('t004'),
  8: demoPoster('t008'),
  39: demoPoster('t039'),
  45: demoPoster('t045'),
  134: demoPoster('t134'),
  137: demoPoster('t137'),
  180: demoPoster('t180'),
  222: demoPoster('t222'),
  232: demoPoster('t232'),
  291: demoPoster('t291'),
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
