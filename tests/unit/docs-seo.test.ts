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
});
