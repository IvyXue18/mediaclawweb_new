import { readFileSync } from 'node:fs';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import mdx from '@mdx-js/rollup';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import remarkGfm from 'remark-gfm';
import { defineConfig, type Plugin } from 'vite';

import { loadEnvFiles } from './src/lib/env';

// Populate process.env from .env.local / .env.{NODE_ENV} / .env for the
// dev server and build process (Vite only exposes VITE_* via import.meta.env;
// server code reads secrets from process.env). In production, env comes
// from the actual host/container environment.
loadEnvFiles();

// Cloudflare Workers build (pnpm cf:build / cf:deploy): stub out unused DB
// drivers — mysql2 crashes workerd at module evaluation (node:net,
// node:process requires); postgres.js runs fine under nodejs_compat but is
// dead weight when the backend is D1. Which driver the bundle keeps follows
// wrangler.jsonc `vars.DATABASE_PROVIDER` (the runtime truth on workerd) —
// d1 stubs both, postgresql keeps postgres.js for the Hyperdrive binding.
const isCloudflareBuild = (process.env.NITRO_PRESET || '').includes(
  'cloudflare'
);
const driverStub = new URL('./src/core/db/driver-stub.ts', import.meta.url)
  .pathname;
const referralSettlementTask = new URL(
  './tasks/referral/settle.ts',
  import.meta.url
).pathname;

// Prefer wrangler.jsonc over the build-time env, which can be polluted by
// .env.local (e.g. DATABASE_PROVIDER=sqlite for local dev).
function workersDbProvider(): string {
  try {
    const raw = readFileSync(
      new URL('./wrangler.jsonc', import.meta.url),
      'utf8'
    );
    const m = raw.match(/"DATABASE_PROVIDER"\s*:\s*"([^"]+)"/);
    if (m) return m[1];
  } catch {
    // no wrangler.jsonc yet (fresh clone) — fall through
  }
  return process.env.DATABASE_PROVIDER || 'd1';
}

const workersDb = isCloudflareBuild ? workersDbProvider() : '';
const keepPostgres = workersDb === 'postgresql' || workersDb === 'postgres';
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

const mdxPlugin = mdx({
  providerImportSource: '@mdx-js/react',
  remarkPlugins: [remarkGfm],
});
const mdxTransform = mdxPlugin.transform;

if (typeof mdxTransform !== 'function') {
  throw new TypeError('Expected the MDX plugin to expose a transform hook');
}

const mdxPluginWithRawSupport: Plugin = {
  ...mdxPlugin,
  enforce: 'pre',
  transform(code, id, options) {
    // Let Vite's raw loader return the original Markdown string. The MDX
    // compiler otherwise sees the path after stripping the query and turns
    // `?raw` imports into React components.
    if (id.includes('?raw')) return null;
    return mdxTransform.call(this, code, id, options);
  },
};

export default defineConfig({
  server: {
    port: 3000,
    watch: {
      ignored: ['**/src/routeTree.gen.ts'],
    },
  },
  resolve: {
    tsconfigPaths: true,
    alias: isCloudflareBuild
      ? {
          mysql2: driverStub,
          ...(keepPostgres ? {} : { postgres: driverStub }),
        }
      : {},
  },
  plugins: [
    // MDX must run before the react plugin so JSX in compiled MDX gets transformed.
    mdxPluginWithRawSupport,
    tailwindcss(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      // Rolldown cannot currently resolve Paraglide's string-literal message
      // exports through the message-modules `export *` chain. It treats valid
      // `m['namespace.key']` calls as undefined and emits `(void 0)()` in the
      // browser bundle. A single locale index keeps those exports visible.
      outputStructure: 'locale-modules',
      cookieName: 'PARAGLIDE_LOCALE',
      strategy: ['url', 'cookie', 'baseLocale'],
      urlPatterns: [
        // API endpoints are never locale-prefixed.
        {
          pattern: '/api/:path(.*)?',
          localized: [
            ['en', '/api/:path(.*)?'],
            ['zh', '/api/:path(.*)?'],
          ],
        },
        // Bare locale homes match without a trailing-slash redirect.
        {
          pattern: '/',
          localized: [
            ['zh', '/'],
            ['en', '/en'],
          ],
        },
        // Match the old MediaClaw URL contract: zh is the canonical
        // unprefixed locale, English lives under /en.
        {
          pattern: '/:path(.*)?',
          localized: [
            ['en', '/en/:path(.*)?'],
            ['zh', '/:path(.*)?'],
          ],
        },
      ],
    }),
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact(),
    nitro({
      experimental: {
        tasks: true,
      },
      tasks: {
        'referral:settle': {
          handler: referralSettlementTask,
          description:
            'Settle referral commissions whose lock period has expired',
        },
      },
      scheduledTasks: {
        // Cloudflare cron expressions use UTC. Sunday 18:15 UTC is
        // Monday 02:15 in Asia/Shanghai. Use SUN because Cloudflare numbers
        // weekdays 1–7, unlike schedulers that accept 0 for Sunday.
        '15 18 * * SUN': ['referral:settle'],
      },
      publicAssets: [
        {
          baseURL: '/imgs',
          dir: 'public/imgs',
          maxAge: ONE_YEAR_IN_SECONDS,
        },
      ],
    }),
  ],
});
