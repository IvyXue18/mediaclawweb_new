import { buildAdminOrderSearchCondition } from '@/routes/api/admin/-order-search';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';
import { describe, expect, it } from 'vitest';

const dialect = new SQLiteSyncDialect();

describe('admin order search', () => {
  it('ignores an empty search term', () => {
    expect(buildAdminOrderSearchCondition('   ')).toBeUndefined();
  });

  it('searches order number and user identity fields', () => {
    const condition = buildAdminOrderSearchCondition(' 13968185519 ');
    expect(condition).toBeDefined();

    const query = dialect.sqlToQuery(condition!);
    expect(query.sql).toContain('"order"."order_no" like ?');
    expect(query.sql).toContain('"order"."user_email" like ?');
    expect(query.sql).toContain('"user"."email" like ?');
    expect(query.sql).toContain('"user"."name" like ?');
    expect(query.params).toEqual([
      '%13968185519%',
      '%13968185519%',
      '%13968185519%',
      '%13968185519%',
    ]);
  });

  it('caps the search term before building wildcard queries', () => {
    const condition = buildAdminOrderSearchCondition('x'.repeat(200));
    const query = dialect.sqlToQuery(condition!);

    expect(query.params).toEqual(Array(4).fill(`%${'x'.repeat(120)}%`));
  });
});
