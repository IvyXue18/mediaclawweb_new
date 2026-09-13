import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const POSTS_DIR = resolve(process.cwd(), 'src/content/posts');

describe('SEO internal links', () => {
  it('keeps Chinese post links locale-free', () => {
    const invalidLinks: string[] = [];

    for (const filename of readdirSync(POSTS_DIR)) {
      if (!filename.endsWith('.zh.mdx')) continue;

      const content = readFileSync(resolve(POSTS_DIR, filename), 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (
          /\]\(\/zh(?:\/|\))/.test(line) ||
          /href=["']\/zh(?:\/|["'])/.test(line) ||
          /https?:\/\/(?:www\.)?mediaclaw\.app\/zh(?:\/|\b)/.test(line)
        ) {
          invalidLinks.push(`${filename}:${index + 1}`);
        }
      });
    }

    expect(invalidLinks).toEqual([]);
  });
});
