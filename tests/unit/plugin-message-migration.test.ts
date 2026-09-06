import { readFileSync } from 'node:fs';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import config from '../../drizzle/plugin-messages.config';
import * as schema from '../../drizzle/plugin-messages.schema';
import journal from '../../drizzle/postgres-plugin-messages/meta/_journal.json';
import snapshot from '../../drizzle/postgres-plugin-messages/meta/0000_snapshot.json';
import {
  pluginMessage,
  pluginMessageReceipt,
} from '../../src/config/db/schema.postgres';

const migration = readFileSync(
  new URL(
    '../../drizzle/postgres-plugin-messages/0000_plugin_messages.sql',
    import.meta.url
  ),
  'utf8'
);

describe('production plugin message migration', () => {
  it('isolates PostgreSQL history and exports only the new application tables', () => {
    expect(config.dialect).toBe('postgresql');
    expect(config.out).toBe('./drizzle/postgres-plugin-messages');
    expect(config.migrations).toEqual({
      schema: 'drizzle',
      table: '__drizzle_migrations_plugin_messages',
    });
    expect(journal.dialect).toBe('postgresql');
    expect(journal.entries.map((entry) => entry.tag)).toEqual([
      '0000_plugin_messages',
    ]);
    expect(Object.keys(schema).sort()).toEqual([
      'pluginMessage',
      'pluginMessageReceipt',
    ]);
    expect(schema.pluginMessage).toBe(pluginMessage);
    expect(schema.pluginMessageReceipt).toBe(pluginMessageReceipt);
  });

  it('matches the application column definitions and indexes', () => {
    const entries = [
      [pluginMessage, snapshot.tables['public.plugin_message']],
      [pluginMessageReceipt, snapshot.tables['public.plugin_message_receipt']],
    ] as const;

    for (const [table, saved] of entries) {
      const current = getTableConfig(table);
      expect(current.columns.map((column) => column.name)).toEqual(
        Object.keys(saved.columns)
      );
      expect(
        current.columns.map((column) => ({
          name: column.name,
          type: column.getSQLType(),
          notNull: column.notNull,
          primaryKey: column.primary,
        }))
      ).toEqual(
        Object.values(saved.columns).map((column) => ({
          name: column.name,
          type: column.type,
          notNull: column.notNull,
          primaryKey: column.primaryKey,
        }))
      );
      expect(current.indexes.map((index) => index.config.name).sort()).toEqual(
        Object.keys(saved.indexes).sort()
      );
    }
  });

  it('only creates the new tables and their indexes and foreign key', () => {
    expect(
      [...migration.matchAll(/CREATE TABLE "public"\."([^"]+)"/g)].map(
        (match) => match[1]
      )
    ).toEqual(['plugin_message', 'plugin_message_receipt']);
    expect(migration.match(/CREATE (?:UNIQUE )?INDEX /g)).toHaveLength(4);
    expect(migration.match(/ALTER TABLE /g)).toHaveLength(1);
    expect(migration).toContain(
      'REFERENCES "public"."plugin_message"("id") ON DELETE cascade'
    );
    expect(migration).not.toMatch(
      /\b(?:DROP|TRUNCATE|INSERT\s+INTO|UPDATE\s+"|DELETE\s+FROM|RENAME)\b/i
    );
    expect(migration).not.toMatch(
      /"(?:user|order|credit|referral_commission)"/
    );
  });

  it('bounds lock waits and query duration', () => {
    expect(migration).toContain("SET LOCAL lock_timeout = '2s'");
    expect(migration).toContain("SET LOCAL statement_timeout = '30s'");
  });
});
