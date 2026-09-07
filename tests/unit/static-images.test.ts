import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import {
  auditStaticImages,
  imageReferences,
  publicImageVersions,
  staticImageVersionsPlugin,
  versionImageReferences,
} from '../../scripts/lib/static-images.mjs';

const tempDirs: string[] = [];
const versions = new Map([
  ['/imgs/a.webp', 'aaaaaaaaaaaaaaaa'],
  ['/imgs/b.webp', 'bbbbbbbbbbbbbbbb'],
  ['/imgs/按关键词&IP 地址筛选.webp', 'cccccccccccccccc'],
]);

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true });
});

describe('public image cache recovery', () => {
  it('versions JSX, DocImageGrid, Markdown, JSON and srcSet without changing their syntax', () => {
    const inputs = [
      '<img src="/imgs/a.webp" />',
      '<DocImageGrid images={[{ src: "/imgs/a.webp" }]} />',
      '![example](/imgs/a.webp)',
      '{"src":"/imgs/a.webp"}',
      '<img srcSet="/imgs/a.webp 1x, /imgs/b.webp 2x" />',
    ];
    for (const source of inputs) {
      const result = versionImageReferences(source, versions);
      expect(result).toContain('/imgs/a.webp?v=aaaaaaaaaaaaaaaa');
      expect(result.replace(/\?v=[a-f0-9]{16}/g, '')).toBe(source);
      expect(versionImageReferences(result, versions)).toBe(result);
    }
  });

  it('also versions raw MDX strings used by the Markdown endpoint', () => {
    const mdx = '<DocImage src="/imgs/a.webp" />\n![example](/imgs/b.webp)';
    const compiledRaw = JSON.stringify(mdx);
    const result = versionImageReferences(compiledRaw, versions);
    expect(JSON.parse(result)).toBe(versionImageReferences(mdx, versions));
  });

  it('preserves spaced/encoded filenames, query parameters and fragments, replacing an old version', () => {
    const spaced = '<DocImage src="/imgs/按关键词&IP 地址筛选.webp" />';
    expect(imageReferences(spaced)[0].url).toBe(
      '/imgs/按关键词&IP 地址筛选.webp'
    );
    expect(versionImageReferences(spaced, versions)).toContain(
      '地址筛选.webp?v=cccccccccccccccc'
    );
    const encoded = encodeURI('/imgs/按关键词&IP 地址筛选.webp');
    expect(versionImageReferences(`"${encoded}"`, versions)).toContain(
      `${encoded}?v=cccccccccccccccc`
    );
    const result = versionImageReferences(
      '"/imgs/a.webp?size=2&v=old#preview"',
      versions
    );
    expect(result).toBe('"/imgs/a.webp?size=2&v=aaaaaaaaaaaaaaaa#preview"');
  });

  it('leaves external URLs, filesystem paths and unresolved dynamic URLs untouched', () => {
    const source = [
      '"https://cdn.example/imgs/a.webp"',
      '"//cdn.example/imgs/a.webp"',
      '"public/imgs/a.webp"',
      '`/imgs/${name}.webp`',
      '"/imgs/missing.webp"',
    ].join('\n');
    expect(versionImageReferences(source, versions)).toBe(source);
  });

  it('changes the URL only when image content changes, and blocks missing images at build time', () => {
    const root = mkdtempSync(join(tmpdir(), 'static-images-test-'));
    tempDirs.push(root);
    mkdirSync(join(root, 'public/imgs'), { recursive: true });
    mkdirSync(join(root, 'src'));
    mkdirSync(join(root, 'messages'));
    writeFileSync(join(root, 'public/imgs/a.webp'), 'first image');
    writeFileSync(
      join(root, 'src/page.mdx'),
      '<img src="/imgs/a.webp" />\n<img src="/imgs/missing.webp" />'
    );
    const first = publicImageVersions(root);
    expect(publicImageVersions(root)).toEqual(first);
    writeFileSync(join(root, 'public/imgs/a.webp'), 'updated image');
    expect(publicImageVersions(root).get('/imgs/a.webp')).not.toBe(
      first.get('/imgs/a.webp')
    );
    const audit = auditStaticImages(root);
    expect(audit.missing).toEqual([
      expect.objectContaining({
        file: 'src/page.mdx',
        url: '/imgs/missing.webp',
        line: 2,
      }),
    ]);
    const plugin = staticImageVersionsPlugin();
    (plugin.configResolved as Function)({ root });
    expect(() =>
      (plugin.buildStart as Function).call({
        error: (message: string) => {
          throw new Error(message);
        },
      })
    ).toThrow('src/page.mdx:2 /imgs/missing.webp');
  });

  it('finds no missing static images across the actual application and content', () => {
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const audit = auditStaticImages(root);
    expect(audit.uniqueImages).toBeGreaterThan(250);
    expect(audit.missing).toEqual([]);
  });
});
