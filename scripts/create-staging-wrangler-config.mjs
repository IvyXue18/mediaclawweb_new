import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const generatedPath = '.output/server/wrangler.json';
const outputPath = '.wrangler/staging-wrangler.json';
const generated = JSON.parse(readFileSync(generatedPath, 'utf8'));
const staging = generated.env?.staging;

if (!staging?.name) {
  throw new Error('Missing env.staging in generated Wrangler config');
}

const config = {
  ...generated,
  ...staging,
  vars: {
    ...(generated.vars || {}),
    ...(staging.vars || {}),
  },
  routes: staging.routes || [],
  hyperdrive: staging.hyperdrive || generated.hyperdrive || [],
  main: '../.output/server/index.mjs',
  assets: generated.assets
    ? {
        ...generated.assets,
        directory: '../.output/public',
      }
    : undefined,
};

delete config.env;
mkdirSync('.wrangler', { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Prepared staging Wrangler config: ${outputPath}`);
