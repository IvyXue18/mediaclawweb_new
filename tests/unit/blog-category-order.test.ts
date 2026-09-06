import { describe, expect, it } from 'vitest';

import { compareBlogCategoryEntries } from '../../src/lib/blog-category-order';

describe('blog category ordering', () => {
  it('sorts higher-frequency categories first', () => {
    const entries: Array<[string, { label: string; count: number }]> = [
      ['low', { label: 'Low', count: 1 }],
      ['high', { label: 'High', count: 3 }],
    ];

    expect(
      entries.sort(compareBlogCategoryEntries).map(([slug]) => slug)
    ).toEqual(['high', 'low']);
  });

  it('uses locale-independent slug order to break count ties', () => {
    const entries: Array<[string, { label: string; count: number }]> = [
      ['短视频运营', { label: '短视频运营', count: 2 }],
      ['关键词挖掘', { label: '关键词挖掘', count: 2 }],
    ];

    expect(
      entries.sort(compareBlogCategoryEntries).map(([slug]) => slug)
    ).toEqual(['关键词挖掘', '短视频运营']);
  });
});
