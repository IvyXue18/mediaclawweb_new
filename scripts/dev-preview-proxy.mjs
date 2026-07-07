import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import http from 'node:http';
import { Readable } from 'node:stream';

const publicPort = Number(process.env.LOCAL_PROXY_PORT || 3000);
const workerPort = Number(process.env.LOCAL_WRANGLER_PORT || 3002);
const wranglerConfig =
  process.env.WRANGLER_CONFIG || '.output/server/wrangler.json';

function readDotEnvValue(file, key) {
  if (!existsSync(file)) return undefined;

  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || match[1] !== key) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }
}

const previewOrigin =
  process.env.LOCAL_API_PROXY_ORIGIN ||
  readDotEnvValue('.dev.vars', 'LOCAL_API_PROXY_ORIGIN') ||
  readDotEnvValue('.output/server/.dev.vars', 'LOCAL_API_PROXY_ORIGIN');

if (!previewOrigin) {
  console.error(
    'Missing LOCAL_API_PROXY_ORIGIN. Set it in .dev.vars or the shell.'
  );
  process.exit(1);
}

const localWorkerOrigin = `http://127.0.0.1:${workerPort}`;
const publicHost = process.env.LOCAL_PROXY_HOST || '127.0.0.1';

function rewriteRequestCookie(cookie) {
  if (!cookie) return cookie;
  return cookie.replace(/(^|;\s*)better-auth\./g, '$1__Secure-better-auth.');
}

function splitSetCookieHeader(header) {
  return header
    .split(/,(?=\s*[^;,=\s]+=)/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getSetCookieHeaders(headers) {
  if (typeof headers.getSetCookie === 'function') {
    const values = headers.getSetCookie();
    if (values.length > 0) return values;
  }

  const combined = headers.get('set-cookie');
  return combined ? splitSetCookieHeader(combined) : [];
}

function rewriteResponseCookie(cookie) {
  return cookie
    .replace(/^__Secure-better-auth\./, 'better-auth.')
    .replace(/^__Host-better-auth\./, 'better-auth.')
    .replace(/;\s*Secure/gi, '')
    .replace(/;\s*Domain=[^;]*/gi, '');
}

function copyResponseHeaders(
  sourceHeaders,
  res,
  { rewriteCookies, decodedBody = false }
) {
  const setCookies = getSetCookieHeaders(sourceHeaders);

  for (const [key, value] of sourceHeaders) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'set-cookie') continue;
    if (
      decodedBody &&
      (lowerKey === 'content-encoding' || lowerKey === 'content-length')
    ) {
      continue;
    }
    res.setHeader(key, value);
  }

  if (setCookies.length > 0) {
    res.setHeader(
      'set-cookie',
      rewriteCookies ? setCookies.map(rewriteResponseCookie) : setCookies
    );
  }
}

function setHeader(res, key, value) {
  const current = res.getHeader(key);
  if (!current) {
    res.setHeader(key, value);
    return;
  }

  const values = Array.isArray(current) ? current : [String(current)];
  values.push(value);
  res.setHeader(key, values);
}

function copyParsedResponseHeaders(headers, res, { rewriteCookies }) {
  const setCookies = [];

  for (const [key, value] of headers) {
    if (key.toLowerCase() === 'set-cookie') {
      setCookies.push(value);
    } else {
      setHeader(res, key, value);
    }
  }

  if (setCookies.length > 0) {
    res.setHeader(
      'set-cookie',
      rewriteCookies ? setCookies.map(rewriteResponseCookie) : setCookies
    );
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseCurlResponse(buffer) {
  const headerEnd = buffer.indexOf('\r\n\r\n');
  if (headerEnd < 0) {
    throw new Error('Could not parse curl response headers');
  }

  const headerText = buffer.subarray(0, headerEnd).toString('latin1');
  const body = buffer.subarray(headerEnd + 4);
  const lines = headerText.split(/\r?\n/).filter(Boolean);
  const statusLine = lines.shift() || '';
  const statusMatch = statusLine.match(/^HTTP\/\S+\s+(\d+)\s*(.*)$/);
  if (!statusMatch) {
    throw new Error(`Could not parse curl status line: ${statusLine}`);
  }

  const headers = [];
  for (const line of lines) {
    const separator = line.indexOf(':');
    if (separator <= 0) continue;
    headers.push([
      line.slice(0, separator).trim(),
      line.slice(separator + 1).trim(),
    ]);
  }

  return {
    status: Number(statusMatch[1]),
    statusText: statusMatch[2] || '',
    headers,
    body,
  };
}

async function proxyApiRequestWithCurl(req, res, targetUrl, headers) {
  const args = [
    '--silent',
    '--show-error',
    '--include',
    '--http1.1',
    '--suppress-connect-headers',
    '--max-time',
    '30',
    '--request',
    req.method,
  ];

  for (const [key, value] of headers) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey === 'host' ||
      lowerKey === 'content-length' ||
      lowerKey === 'connection' ||
      lowerKey === 'accept-encoding'
    ) {
      continue;
    }
    args.push('-H', `${key}: ${value}`);
  }

  const body =
    req.method === 'GET' || req.method === 'HEAD'
      ? Buffer.alloc(0)
      : await readRequestBody(req);
  if (body.length > 0) {
    args.push('--data-binary', '@-');
  }

  args.push(targetUrl.toString());

  await new Promise((resolve, reject) => {
    const curl = spawn('curl', args, {
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];

    curl.stdout.on('data', (chunk) => stdout.push(chunk));
    curl.stderr.on('data', (chunk) => stderr.push(chunk));
    curl.on('error', reject);
    curl.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            Buffer.concat(stderr).toString('utf8') ||
              `curl exited with code ${code}`
          )
        );
        return;
      }

      try {
        const response = parseCurlResponse(Buffer.concat(stdout));
        res.statusCode = response.status;
        res.statusMessage = response.statusText;
        copyParsedResponseHeaders(response.headers, res, {
          rewriteCookies: true,
        });
        res.setHeader('x-mediaclaw-local-api-proxy', 'node');
        res.end(response.body);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    if (body.length > 0) {
      curl.stdin.end(body);
    } else {
      curl.stdin.end();
    }
  });
}

async function proxyRequest(req, res, targetOrigin, { apiProxy = false } = {}) {
  const targetUrl = new URL(req.url || '/', targetOrigin);
  const headers = new Headers(req.headers);
  headers.delete('host');

  if (apiProxy) {
    const rewrittenCookie = rewriteRequestCookie(headers.get('cookie'));
    if (rewrittenCookie) {
      headers.set('cookie', rewrittenCookie);
    } else {
      headers.delete('cookie');
    }
    headers.set('x-mediaclaw-local-proxy', '1');
  }

  if (apiProxy) {
    try {
      await proxyApiRequestWithCurl(req, res, targetUrl, headers);
      return;
    } catch (error) {
      console.error(
        `[dev-preview-proxy] ${req.method} ${req.url} -> ${targetUrl} failed`,
        error
      );
      res.statusCode = 502;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: true, message: 'Proxy request failed' }));
      return;
    }
  }

  const init = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req;
    init.duplex = 'half';
  }

  try {
    const response = await fetch(targetUrl, init);
    res.statusCode = response.status;
    res.statusMessage = response.statusText;
    copyResponseHeaders(response.headers, res, {
      rewriteCookies: apiProxy,
      decodedBody: true,
    });

    if (apiProxy) {
      res.setHeader('x-mediaclaw-local-api-proxy', 'node');
    }

    if (!response.body) {
      res.end();
      return;
    }

    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    console.error(
      `[dev-preview-proxy] ${req.method} ${req.url} -> ${targetUrl} failed`,
      error
    );
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: true, message: 'Proxy request failed' }));
  }
}

if (existsSync('.dev.vars')) {
  copyFileSync('.dev.vars', '.output/server/.dev.vars');
}

let wrangler;

const server = http.createServer((req, res) => {
  const isApiRequest = (req.url || '/').startsWith('/api/');
  const targetOrigin = isApiRequest ? previewOrigin : localWorkerOrigin;
  proxyRequest(req, res, targetOrigin, {
    apiProxy: isApiRequest,
  });
});

server.on('error', (error) => {
  console.error('[dev-preview-proxy] server failed', error);
  wrangler?.kill('SIGINT');
  process.exit(1);
});

server.listen(publicPort, publicHost, () => {
  console.log(
    `[dev-preview-proxy] http://${publicHost}:${publicPort} -> pages ${localWorkerOrigin}, api ${previewOrigin}`
  );
});

wrangler = spawn(
  'pnpm',
  [
    'exec',
    'wrangler',
    'dev',
    '--config',
    wranglerConfig,
    '--port',
    String(workerPort),
  ],
  { stdio: 'inherit' }
);

function shutdown() {
  server.close();
  wrangler.kill('SIGINT');
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

wrangler.on('exit', (code, signal) => {
  server.close(() => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });
});
