#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_HOST = 'mediaclaw.app';
const DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const args = {
    dryRun: false,
    host: process.env.INDEXNOW_HOST || DEFAULT_HOST,
    key: process.env.INDEXNOW_KEY || '',
    keyLocation: process.env.INDEXNOW_KEY_LOCATION || '',
    sitemap: process.env.INDEXNOW_SITEMAP || '',
    endpoint: process.env.INDEXNOW_ENDPOINT || DEFAULT_ENDPOINT,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') {
      continue;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--host') {
      args.host = argv[++i] || args.host;
    } else if (arg === '--key') {
      args.key = argv[++i] || args.key;
    } else if (arg === '--key-location') {
      args.keyLocation = argv[++i] || args.keyLocation;
    } else if (arg === '--sitemap') {
      args.sitemap = argv[++i] || args.sitemap;
    } else if (arg === '--endpoint') {
      args.endpoint = argv[++i] || args.endpoint;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  args.host = args.host.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  args.sitemap ||= `https://${args.host}/sitemap.xml`;
  return args;
}

async function findIndexNowKey() {
  const publicDir = path.join(ROOT, 'public');
  const files = await readdir(publicDir);

  for (const file of files) {
    if (!/^[a-f0-9]{8,128}\.txt$/i.test(file)) continue;
    const key = file.replace(/\.txt$/i, '');
    const content = (await readFile(path.join(publicDir, file), 'utf8')).trim();
    if (content === key) return key;
  }

  return '';
}

function collectUrlsFromSitemap(xml, host) {
  const urls = new Set();
  const patterns = [
    /<loc>\s*([^<\s]+)\s*<\/loc>/gi,
    /\shref=["']([^"']+)["']/gi,
  ];

  for (const pattern of patterns) {
    for (const match of xml.matchAll(pattern)) {
      try {
        const url = new URL(match[1]);
        if (url.protocol !== 'https:') continue;
        if (url.hostname !== host) continue;
        if (url.search || url.hash) continue;
        urls.add(url.href.replace(/\/$/, url.pathname === '/' ? '/' : ''));
      } catch {
        // Ignore malformed XML values.
      }
    }
  }

  return [...urls].sort();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { accept: 'application/xml,text/xml,text/plain,*/*' },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Failed to fetch ${url}: ${response.status}${text ? ` ${text.slice(0, 200)}` : ''}`
    );
  }
  return response.text();
}

async function submitIndexNow(args, urls) {
  const payload = {
    host: args.host,
    key: args.key,
    keyLocation: args.keyLocation,
    urlList: urls,
  };

  if (args.dryRun) {
    console.log(`[indexnow] dry run: ${urls.length} URL(s) would be submitted`);
    console.log(`[indexnow] keyLocation: ${args.keyLocation}`);
    console.log(`[indexnow] first URLs:\n${urls.slice(0, 10).join('\n')}`);
    return;
  }

  const response = await fetch(args.endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok && response.status !== 202) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `IndexNow returned ${response.status}${text ? `: ${text.slice(0, 300)}` : ''}`
    );
  }

  console.log(`[indexnow] submitted ${urls.length} URL(s) to ${args.endpoint}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  args.key ||= await findIndexNowKey();
  if (!args.key) {
    throw new Error(
      'Missing IndexNow key. Add public/<key>.txt or set INDEXNOW_KEY.'
    );
  }
  args.keyLocation ||= `https://${args.host}/${args.key}.txt`;

  const sitemapXml = await fetchText(args.sitemap);
  const urls = collectUrlsFromSitemap(sitemapXml, args.host);
  if (!urls.length) {
    throw new Error(`No https://${args.host} URLs found in ${args.sitemap}`);
  }

  await submitIndexNow(args, urls);
}

main().catch((error) => {
  console.error(
    `[indexnow] ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
});
