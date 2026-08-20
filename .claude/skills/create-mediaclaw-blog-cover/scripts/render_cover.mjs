#!/usr/bin/env node
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
let moduleRoot = process.cwd();

if (args[0] === '--module-root') {
  moduleRoot = path.resolve(args[1] || '');
  args.splice(0, 2);
}

const [htmlPath, outputPath] = args;
if (!htmlPath || !outputPath) {
  console.error('Usage: render_cover.mjs [--module-root <project-root>] <cover.html> <cover.png>');
  process.exit(1);
}

const packageJson = path.join(moduleRoot, 'package.json');
if (!fs.existsSync(packageJson)) {
  console.error(`Playwright module root has no package.json: ${moduleRoot}`);
  process.exit(1);
}

const projectRequire = createRequire(packageJson);
let chromium;
try {
  ({ chromium } = projectRequire('@playwright/test'));
} catch (testPackageError) {
  try {
    ({ chromium } = projectRequire('playwright'));
  } catch (playwrightError) {
    console.error(`Playwright is unavailable from module root: ${moduleRoot}`);
    console.error('Install @playwright/test or playwright there, or pass a different --module-root.');
    process.exit(1);
  }
}
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.resolve(htmlPath)).href, { waitUntil: 'networkidle' });
await page.screenshot({ path: path.resolve(outputPath), fullPage: false });
await browser.close();
console.log(path.resolve(outputPath));
