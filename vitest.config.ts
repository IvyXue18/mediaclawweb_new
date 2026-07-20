import path from 'node:path';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: 'next/cache',
        replacement: path.resolve(
          __dirname,
          'tests/migration-compat/next/cache.ts'
        ),
      },
      {
        find: /^@\/core\/rbac$/,
        replacement: path.resolve(
          __dirname,
          'tests/migration-compat/core/rbac.ts'
        ),
      },
      {
        find: /^@\/app\//,
        replacement: `${path.resolve(__dirname, 'tests/migration-compat/app')}/`,
      },
      {
        find: /^@\/shared\//,
        replacement: `${path.resolve(__dirname, 'tests/migration-compat/shared')}/`,
      },
      {
        find: /^@\/extensions\//,
        replacement: `${path.resolve(__dirname, 'tests/migration-compat/extensions')}/`,
      },
      {
        find: /^@\/themes\//,
        replacement: `${path.resolve(__dirname, 'tests/migration-compat/themes')}/`,
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
});
