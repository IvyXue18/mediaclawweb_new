import MarkdownIt from 'markdown-it';
import { describe, expect, it } from 'vitest';

const documents = import.meta.glob<string>('/src/content/docs/**/*.mdx', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const markdown = new MarkdownIt();

describe('documentation tables', () => {
  it('does not leave table delimiters rendered as ordinary paragraphs', () => {
    expect(Object.keys(documents).length).toBeGreaterThan(0);

    for (const [path, source] of Object.entries(documents)) {
      const tokens = markdown.parse(source, {});
      for (const [index, token] of tokens.entries()) {
        // Fenced code examples are not paragraphs and should remain literal.
        if (
          token.type === 'inline' &&
          tokens[index - 1]?.type === 'paragraph_open'
        ) {
          expect(
            token.content,
            `${path}: malformed Markdown table`
          ).not.toMatch(/^\s*\|(?:[ \t]*:?-+:?[ \t]*\|)+[ \t]*$/m);
        }
      }
    }
  });

  it('renders the knowledge-base tool comparison as four columns and six tools', () => {
    const source = documents['/src/content/docs/agent/knowledge-base.mdx'];
    expect(source).toBeDefined();

    const tables = markdown.render(source).match(/<table>[\s\S]*?<\/table>/g);
    expect(tables).toHaveLength(2);

    const toolsTable = tables![1];
    expect(toolsTable.match(/<th>/g)).toHaveLength(4);
    expect(toolsTable).toContain('<th>工具</th>');
    expect(toolsTable).toContain('<th>归属</th>');
    expect(toolsTable).toContain('<th>通道</th>');
    expect(toolsTable).toContain('<th>怎么接</th>');
    expect(toolsTable.match(/<tr>/g)).toHaveLength(7);
    expect(toolsTable.match(/<td>/g)).toHaveLength(24);
  });
});
