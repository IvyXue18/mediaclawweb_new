import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const target = process.argv[2] || 'production';
const generatedPath = '.output/server/wrangler.json';
const outputPath = `.wrangler/${target}-wrangler.json`;
const generated = JSON.parse(readFileSync(generatedPath, 'utf8'));

if (!['production', 'staging'].includes(target)) {
  throw new Error(`Unsupported Wrangler deploy target: ${target}`);
}

const environment = target === 'staging' ? generated.env?.staging : null;
if (target === 'staging' && !environment?.name) {
  throw new Error('Missing env.staging in generated Wrangler config');
}

const config = {
  ...generated,
  ...(environment || {}),
  vars: {
    ...(generated.vars || {}),
    ...(environment?.vars || {}),
  },
  routes: environment?.routes || generated.routes || [],
  hyperdrive: environment?.hyperdrive || generated.hyperdrive || [],
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
console.log(`Prepared ${target} Wrangler config: ${outputPath}`);
