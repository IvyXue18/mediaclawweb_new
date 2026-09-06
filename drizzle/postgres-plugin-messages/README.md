# Plugin messages: PostgreSQL migration

This is a narrowly scoped migration stream for the existing production database.
It is not a baseline for the whole application. The root `drizzle/meta` journal
uses SQLite and must not be applied to PostgreSQL.

## Review scope

- Create `public.plugin_message` (19 columns) and
  `public.plugin_message_receipt` (10 columns), including their primary keys.
- Create four secondary indexes, including the unique `(message_id, subject_key)`
  index that prevents duplicate receipts for the same message and recipient.
- Add a foreign key between these two new tables. Deleting a message later also
  deletes its own receipts; this migration does not delete any records.
- Drizzle maintains `drizzle.__drizzle_migrations_plugin_messages` separately from
  all other migration histories, creating that metadata table/schema if needed.
- Do not modify any existing user, order, payment, credit, or referral table.

The schema entry point re-exports only these two tables from the application's
PostgreSQL schema. No schema definitions are duplicated.

## Generate and apply

From the repository root:

```sh
pnpm db:generate:plugin-messages --name=plugin_messages
```

Review the generated SQL before applying it to production. Provide the direct
PostgreSQL `DATABASE_URL` through the process environment using the existing
secure credential source, not a CLI argument, committed file, or Hyperdrive URL.
The dedicated config deliberately does not load local SQLite env files.

```sh
pnpm db:migrate:plugin-messages
```

The table/index creation and migration-history entry run in one transaction.
The history schema/table bootstrap precedes that transaction and may remain
empty if the migration fails. Lock and statement timeouts are 2 and 30 seconds
for the application-table changes. Re-running an applied migration is a no-op.
Unexpected pre-existing tables cause an error instead of silently accepting
an incompatible schema.

## Release checks

1. Verify the direct connection matches production's current Hyperdrive origin.
2. Confirm neither target table already exists before the first application.
3. Obtain approval for the SQL above, then run the dedicated migrate command.
4. Verify both tables, all 29 columns, four secondary indexes, two primary keys,
   the foreign key, and exactly one history entry.
5. Push the reviewed release commits to `main` to trigger the existing deployment.

If the application release is rolled back, leave these additive tables in place.
Do not automatically drop them: messages or receipts may already contain data.
