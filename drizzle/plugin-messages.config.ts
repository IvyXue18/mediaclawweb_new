import { defineConfig } from 'drizzle-kit';

// Never load the local SQLite env or use the Hyperdrive runtime connection.
// The reviewed production migration requires an explicit direct PostgreSQL URL.
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && !/^postgres(?:ql)?:\/\//.test(databaseUrl)) {
  throw new Error(
    'Plugin message migrations require a PostgreSQL DATABASE_URL'
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './drizzle/plugin-messages.schema.ts',
  out: './drizzle/postgres-plugin-messages',
  dbCredentials: { url: databaseUrl || '' },
  migrations: {
    schema: 'drizzle',
    table: '__drizzle_migrations_plugin_messages',
  },
});
