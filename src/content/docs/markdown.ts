import { baseLocale } from '@/paraglide/runtime.js';

import { getAllDocSlugs } from './registry';

export type DocResource = {
  slug: string;
  title: string;
  description: string;
  source: string;
};

const rawModules = import.meta.glob<string>('/src/content/docs/**/*.mdx', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function modulePath(slug: string, locale: string): string | null {
  const candidates = [
    `/src/content/docs/${slug}.${locale}.mdx`,
    `/src/content/docs/${slug}.${baseLocale}.mdx`,
    `/src/content/docs/${slug}.mdx`,
  ];

  return (
    candidates.find(
      (candidate) => candidate in rawModules || `${candidate}?raw` in rawModules
    ) ?? null
  );
}

function sourceFor(path: string): string {
  return rawModules[path] ?? rawModules[`${path}?raw`] ?? '';
}

function readQuotedProperty(source: string, property: string): string {
  const propertyMatch = new RegExp(`\\b${property}\\s*:`).exec(source);
  if (!propertyMatch) return '';

  let index = propertyMatch.index + propertyMatch[0].length;
  while (/\s/.test(source[index] ?? '')) index += 1;

  const quote = source[index];
  if (quote !== "'" && quote !== '"' && quote !== '`') return '';

  let result = '';
  for (index += 1; index < source.length; index += 1) {
    const char = source[index];
    if (char === '\\') {
      const next = source[index + 1];
      if (next) {
        result += next === 'n' ? '\n' : next;
        index += 1;
      }
      continue;
    }
    if (char === quote) return result.trim();
    result += char;
  }

  return '';
}

function stripMetaExport(source: string): string {
  const exportStart = source.indexOf('export const meta');
  if (exportStart === -1) return source;

  const objectStart = source.indexOf('{', exportStart);
  if (objectStart === -1) return source;

  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        const semicolon = source[index + 1] === ';' ? index + 2 : index + 1;
        return `${source.slice(0, exportStart)}${source.slice(semicolon)}`;
      }
    }
  }

  return source;
}

function prop(block: string, name: string): string {
  return readQuotedProperty(block.replaceAll('=', ':'), name);
}

function absoluteUrl(value: string, appUrl: string): string {
  if (!value.startsWith('/')) return value;
  return `${appUrl}${value}`;
}

function mediaLine(
  source: string,
  caption: string,
  appUrl: string,
  kind: 'image' | 'video'
): string {
  if (!source) return caption ? `_${caption}_` : '';
  const url = absoluteUrl(source, appUrl);
  const label = caption || (kind === 'image' ? '教程截图' : '教程视频');
  return kind === 'image' ? `![${label}](${url})` : `[${label}](${url})`;
}

function replaceImageGrids(markdown: string, appUrl: string): string {
  return markdown.replace(/<DocImageGrid[\s\S]*?\/>/g, (block) => {
    const lines: string[] = [];
    const objectPattern = /\{\s*src:\s*(['"])(.*?)\1,([\s\S]*?)\}/g;

    for (const match of block.matchAll(objectPattern)) {
      lines.push(
        mediaLine(
          match[2],
          readQuotedProperty(match[3], 'caption'),
          appUrl,
          'image'
        )
      );
    }

    if (!lines.length) {
      for (const match of block.matchAll(/\bsrc:\s*(['"])(.*?)\1/g)) {
        lines.push(mediaLine(match[2], '', appUrl, 'image'));
      }
    }

    return `\n${lines.filter(Boolean).join('\n\n')}\n`;
  });
}

function replacePlatformExamples(markdown: string, appUrl: string): string {
  return markdown.replace(/<PlatformExampleTabs[\s\S]*?\/>/g, (block) => {
    const examples = [
      {
        source: prop(block, 'xiaohongshuSrc'),
        caption: prop(block, 'xiaohongshuCaption') || '小红书示例',
      },
      {
        source: prop(block, 'douyinSrc'),
        caption: prop(block, 'douyinCaption') || '抖音示例',
      },
    ];

    return `\n${examples
      .filter((example) => example.source)
      .map((example) =>
        mediaLine(example.source, example.caption, appUrl, 'image')
      )
      .join('\n\n')}\n`;
  });
}

function mdxBodyToMarkdown(source: string, appUrl: string): string {
  let markdown = stripMetaExport(source);
  markdown = replaceImageGrids(markdown, appUrl);
  markdown = replacePlatformExamples(markdown, appUrl);
  markdown = markdown.replace(/<DocImage[\s\S]*?\/>/g, (block) =>
    mediaLine(prop(block, 'src'), prop(block, 'caption'), appUrl, 'image')
  );
  markdown = markdown.replace(/<DocVideo[\s\S]*?\/>/g, (block) =>
    mediaLine(prop(block, 'src'), prop(block, 'caption'), appUrl, 'video')
  );
  markdown = markdown
    .replace(/<Callout(?:\s[^>]*)?>/g, '')
    .replace(/<\/Callout>/g, '')
    .replace(/<\/?u>/g, '')
    .replace(/^# /gm, '## ')
    .replace(
      /\]\((\/[^)]+)\)/g,
      (_match, url: string) => `](${absoluteUrl(url, appUrl)})`
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return markdown;
}

export function getDocResource(
  slug: string,
  locale = baseLocale
): DocResource | null {
  if (!getAllDocSlugs().includes(slug)) return null;
  const path = modulePath(slug, locale);
  if (!path) return null;

  const source = sourceFor(path);
  const title = readQuotedProperty(source, 'title');
  const description = readQuotedProperty(source, 'description');
  if (!title || !description) return null;

  return { slug, title, description, source };
}

export function getAllDocResources(locale = baseLocale): DocResource[] {
  return getAllDocSlugs()
    .map((slug) => getDocResource(slug, locale))
    .filter((doc): doc is DocResource => doc !== null);
}

export function renderDocMarkdown(doc: DocResource, appUrl: string): string {
  const origin = appUrl.replace(/\/+$/, '');
  const canonicalUrl = `${origin}/docs/${doc.slug}`;
  const body = mdxBodyToMarkdown(doc.source, origin);

  return [
    `# ${doc.title}`,
    '',
    `> ${doc.description}`,
    '',
    `Canonical: ${canonicalUrl}`,
    '',
    body,
    '',
  ].join('\n');
}

export function renderDocsIndexMarkdown(
  docs: DocResource[],
  appUrl: string
): string {
  const origin = appUrl.replace(/\/+$/, '');
  return [
    '# MediaClaw 使用文档',
    '',
    '> 小红书与抖音内容采集、研究、选题、创作及 Agent 工作流教程。',
    '',
    ...docs.map(
      (doc) =>
        `- [${doc.title}](${origin}/docs/${doc.slug}.md): ${doc.description}`
    ),
    '',
  ].join('\n');
}
