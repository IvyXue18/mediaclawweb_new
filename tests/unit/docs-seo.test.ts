import { describe, expect, it } from 'vitest';

import { getAllDocResources, renderDocMarkdown } from '@/content/docs/markdown';
import { getAllDocSlugs } from '@/content/docs/registry';

describe('documentation discovery resources', () => {
  const appUrl = 'https://mediaclaw.app';
  const docs = getAllDocResources('zh');

  it('publishes metadata for every registered document', () => {
    expect(docs).toHaveLength(getAllDocSlugs().length);
    expect(docs.length).toBeGreaterThan(0);

    for (const doc of docs) {
      expect(doc.title.trim()).not.toBe('');
      expect(doc.description.trim()).not.toBe('');
    }
  });

  it('renders clean standalone Markdown with an HTML canonical', () => {
    for (const doc of docs) {
      const markdown = renderDocMarkdown(doc, appUrl);
      expect(markdown).toContain(`# ${doc.title}`);
      expect(markdown).toContain(`Canonical: ${appUrl}/docs/${doc.slug}`);
      expect(markdown).not.toMatch(
        /export const meta|<Doc[A-Z]|<Callout|<PlatformExampleTabs/
      );
    }
  });

  it('preserves image versions and query strings when exporting JSX media to Markdown', () => {
    const source = [
      '<DocImage src="/imgs/example.webp?v=abc&width=800#preview" caption="x=1" />',
      '<PlatformExampleTabs xiaohongshuSrc="/imgs/xhs.webp?v=def" douyinSrc="/imgs/dy.webp?v=ghi" />',
      '<DocVideo src="https://example.com/demo.mp4?quality=high#t=4,8" />',
    ].join('\n');
    const markdown = renderDocMarkdown(
      { slug: 'test', title: 'Test', description: 'Test', source },
      appUrl
    );
    expect(markdown).toContain(
      `![x=1](${appUrl}/imgs/example.webp?v=abc&width=800#preview)`
    );
    expect(markdown).toContain(`${appUrl}/imgs/xhs.webp?v=def`);
    expect(markdown).toContain(`${appUrl}/imgs/dy.webp?v=ghi`);
    expect(markdown).toContain(
      'https://example.com/demo.mp4?quality=high#t=4,8'
    );
  });
});
