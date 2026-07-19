import type { ComponentType } from 'react';

import { baseLocale } from '@/paraglide/runtime.js';
import {
  frontmatterList,
  frontmatterString,
  parseFrontmatter,
} from '@/content/frontmatter';

export const LOG_SLUGS = [
  'v0.0.6',
  'v0.0.7',
  'v0.0.9',
  'v0.1.0',
  'v0.1.1',
  'v0.1.2',
  'v0.1.3',
  'v0.1.5',
  'v0.1.7',
  'v0.1.8',
  'v0.1.9',
  'v0.2.0',
] as const;

export type LogMeta = {
  title: string;
  description: string;
  date: string;
  tags?: string[];
  version?: string;
};

type LogModule = {
  default: ComponentType;
  meta?: LogMeta;
};
type LoadedLogModule = Omit<LogModule, 'meta'> & { meta: LogMeta };

export type ReleaseLog = LogMeta & {
  slug: string;
};

const logModules = import.meta.glob<LogModule>('/src/content/logs/*.mdx', {
  eager: true,
});
const logRawModules = import.meta.glob<string>('/src/content/logs/*.mdx', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function resolveLogMeta(path: string, meta?: LogMeta): LogMeta {
  const frontmatter = parseFrontmatter(
    logRawModules[path] ?? logRawModules[`${path}?raw`]
  );

  return {
    title:
      meta?.title ??
      frontmatterString(frontmatter, 'title') ??
      path
        .split('/')
        .pop()
        ?.replace(/\.zh?\.mdx$/, '') ??
      'Untitled',
    description:
      meta?.description ?? frontmatterString(frontmatter, 'description') ?? '',
    date:
      meta?.date ??
      frontmatterString(frontmatter, 'date') ??
      frontmatterString(frontmatter, 'created_at') ??
      '1970-01-01',
    tags: meta?.tags ?? frontmatterList(frontmatter, 'tags'),
    version: meta?.version ?? frontmatterString(frontmatter, 'version'),
  };
}

export function loadLocalLog(
  slug: string,
  locale: string
): LoadedLogModule | null {
  if (!LOG_SLUGS.includes(slug as (typeof LOG_SLUGS)[number])) {
    return null;
  }

  const logPath = [
    `/src/content/logs/${slug}.${locale}.mdx`,
    `/src/content/logs/${slug}.${baseLocale}.mdx`,
    `/src/content/logs/${slug}.mdx`,
  ].find((candidate) => candidate in logModules);
  if (!logPath) return null;

  const mod = logModules[logPath];
  return {
    ...mod,
    meta: resolveLogMeta(logPath, mod.meta),
  };
}

export function getLocalLogs(locale: string): ReleaseLog[] {
  return LOG_SLUGS.map((slug) => ({
    slug: slug as string,
    mod: loadLocalLog(slug, locale),
  }))
    .filter((entry): entry is { slug: string; mod: LoadedLogModule } =>
      Boolean(entry.mod)
    )
    .map(({ slug, mod }) => ({
      slug,
      ...mod.meta,
    }))
    .sort(
      (a, b) =>
        (b.version || '').localeCompare(a.version || '') ||
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}
