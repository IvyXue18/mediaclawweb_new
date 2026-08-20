import { AsyncLocalStorage } from 'node:async_hooks';

import { envConfigs } from '@/config';

import { createDb } from './create-db';

// workerd forbids reusing TCP sockets across requests ("Cannot perform I/O on
// behalf of a different request"), so TCP-backed drivers (postgres/mysql) must
// get a fresh client per call there — Hyperdrive does the real pooling at the
// edge. The D1 binding and local Node drivers are safe to cache.
const isCloudflareWorker =
  (typeof navigator !== 'undefined' &&
    navigator.userAgent === 'Cloudflare-Workers') ||
  (typeof globalThis !== 'undefined' && 'Cloudflare' in globalThis);

const TCP_PROVIDERS = ['postgresql', 'postgres', 'mysql'];

let dbInstance: any = null;
const requestDbStorage = new AsyncLocalStorage<{ instance?: any }>();

export function withDbRequestScope<T>(callback: () => T): T {
  return requestDbStorage.run({}, callback);
}

export function db() {
  const requestStore =
    isCloudflareWorker && TCP_PROVIDERS.includes(envConfigs.database_provider)
      ? requestDbStorage.getStore()
      : undefined;
  if (requestStore?.instance) return requestStore.instance;
  if (dbInstance) return dbInstance;

  const instance = createDb({
    database_provider: envConfigs.database_provider,
    database_url: envConfigs.database_url || 'file:data/local.db',
    database_auth_token: envConfigs.database_auth_token || undefined,
    db_schema: envConfigs.db_schema,
    db_singleton_enabled: envConfigs.db_singleton_enabled,
    db_max_connections: envConfigs.db_max_connections,
  });

  if (requestStore) {
    requestStore.instance = instance;
  } else if (
    !isCloudflareWorker ||
    !TCP_PROVIDERS.includes(envConfigs.database_provider)
  ) {
    dbInstance = instance;
  }

  return instance;
}

export type { DbConfig } from './types';
export { createDb, closeDb } from './create-db';
