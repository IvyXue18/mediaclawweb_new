import { createHash } from 'node:crypto';

/** Hash browser identifiers before persistence so the raw local value is never stored. */
export function hashBrowserInstallId(value: unknown): string {
  const normalized = String(value || '')
    .trim()
    .slice(0, 256);
  if (!normalized) return '';

  return createHash('sha256')
    .update(`mediaclaw:welfare:v1:${normalized}`)
    .digest('hex');
}
