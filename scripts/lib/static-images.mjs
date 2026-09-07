import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

const imageExtension = /\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i;
const sourceExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.mdx',
  '.css',
]);

// Root-relative URLs only: leave remote URLs and data URLs untouched. Allow
// spaces in filenames (e.g. "02-按关键词&IP 地址筛选.webp") and srcSet entries.
// This also works inside Vite's escaped ?raw strings, so exported Markdown
// and compiled MDX use the same URLs as JSX, JSON content and metadata.
const imageReference =
  /(?<![\w./:%+~-])(\/(?!\/)[^\r\n"'`<>\\()[\]{}?#]*?\.(?:avif|gif|ico|jpe?g|png|svg|webp)(?:\?[^\s"'`<>\\()[\]{}#]*)?(?:#[^\s"'`<>\\()[\]{}]*)?)(?=$|[\s"'`<>,);\\\]}])/gi;

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name === 'paraglide') return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : entry.isFile() ? [path] : [];
  });
}

function pathname(url) {
  return decodeURIComponent(url.split(/[?#]/, 1)[0]);
}

export function publicImageVersions(root) {
  const publicDir = resolve(root, 'public');
  return new Map(
    filesIn(publicDir)
      .filter((file) => imageExtension.test(file))
      .map((file) => [
        `/${relative(publicDir, file).split(sep).join('/')}`,
        createHash('sha256')
          .update(readFileSync(file))
          .digest('hex')
          .slice(0, 16),
      ])
  );
}

export function imageReferences(source) {
  return Array.from(source.matchAll(imageReference), (match) => ({
    url: match[0],
    index: match.index,
    line: source.slice(0, match.index).split('\n').length,
  }));
}

export function versionImageReferences(source, versions) {
  return source.replace(imageReference, (url) => {
    let hash;
    try {
      hash = versions.get(pathname(url));
    } catch {
      return url;
    }
    if (!hash) return url;

    const [beforeFragment, ...fragment] = url.split('#');
    const [path, query = ''] = beforeFragment.split('?');
    const params = new URLSearchParams(query);
    params.set('v', hash);
    return `${path}?${params}${fragment.length ? `#${fragment.join('#')}` : ''}`;
  });
}

export function auditStaticImages(root, versions = publicImageVersions(root)) {
  const references = [];
  const missing = [];
  for (const directory of ['src', 'messages']) {
    for (const file of filesIn(resolve(root, directory))) {
      if (!sourceExtensions.has(extname(file)) || file.endsWith('.gen.ts'))
        continue;
      for (const ref of imageReferences(readFileSync(file, 'utf8'))) {
        const reference = { ...ref, file: relative(root, file) };
        references.push(reference);
        try {
          if (!versions.has(pathname(ref.url))) missing.push(reference);
        } catch {
          missing.push(reference);
        }
      }
    }
  }
  return {
    references,
    uniqueImages: new Set(references.map((ref) => ref.url.split(/[?#]/, 1)[0]))
      .size,
    missing,
  };
}

/** @returns {import('vite').Plugin} */
export function staticImageVersionsPlugin() {
  let root;
  let versions;
  return {
    name: 'static-image-versions',
    // Before MDX/JSX/JSON compilation. ?raw is loaded as an escaped string;
    // replacement doesn't change quotes or line breaks in either form.
    enforce: 'pre',
    configResolved(config) {
      root = config.root;
      versions = publicImageVersions(root);
    },
    buildStart() {
      const audit = auditStaticImages(root, versions);
      if (audit.missing.length) {
        this.error(
          `Missing public images:\n${audit.missing.map((ref) => `${ref.file}:${ref.line} ${ref.url}`).join('\n')}`
        );
      }
    },
    transform(code, id) {
      const file = id.split('?', 1)[0];
      const local = relative(root, file).split(sep).join('/');
      if (
        !/^(src|messages)\//.test(local) ||
        local.startsWith('src/paraglide/')
      )
        return null;
      if (!sourceExtensions.has(extname(file))) return null;
      const updated = versionImageReferences(code, versions);
      return updated === code ? null : { code: updated, map: null };
    },
    configureServer(server) {
      const publicDir = `${resolve(root, 'public')}${sep}`;
      const refresh = (file) => {
        if (!file.startsWith(publicDir) || !imageExtension.test(file)) return;
        versions = publicImageVersions(root);
        server.moduleGraph.invalidateAll();
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.add(publicDir);
      server.watcher
        .on('add', refresh)
        .on('change', refresh)
        .on('unlink', refresh);
      server.httpServer?.once('close', () => {
        server.watcher
          .off('add', refresh)
          .off('change', refresh)
          .off('unlink', refresh);
      });
    },
  };
}
