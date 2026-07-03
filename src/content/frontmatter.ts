export type Frontmatter = Record<string, string | string[]>;

function rawText(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (
    raw &&
    typeof raw === 'object' &&
    'default' in raw &&
    typeof raw.default === 'string'
  ) {
    return raw.default;
  }
  return '';
}

function parseScalar(value: string): string | string[] {
  const trimmed = value.trim().replace(/,$/, '');
  if (!trimmed) return '';

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return parseArray(trimmed);
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseArray(value: string): string[] {
  return Array.from(value.matchAll(/['"]([^'"]+)['"]/g))
    .map((match) => match[1].trim())
    .filter(Boolean);
}

export function parseFrontmatter(raw?: unknown): Frontmatter {
  const text = rawText(raw);
  if (!text.startsWith('---')) return {};

  const end = text.indexOf('\n---', 3);
  if (end === -1) return {};

  const lines = text.slice(3, end).split(/\r?\n/);
  const result: Frontmatter = {};

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || /^\s/.test(line)) continue;

    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    if (value) {
      result[key] = parseScalar(value);
      continue;
    }

    const block: string[] = [];
    let cursor = index + 1;
    while (
      cursor < lines.length &&
      (/^\s/.test(lines[cursor]) || !lines[cursor].trim())
    ) {
      block.push(lines[cursor]);
      cursor += 1;
    }
    index = cursor - 1;

    const blockValue = block.join('\n').trim();
    result[key] = blockValue.startsWith('[')
      ? parseArray(blockValue)
      : blockValue;
  }

  return result;
}

export function frontmatterString(
  meta: Frontmatter,
  key: string
): string | undefined {
  const value = meta[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function frontmatterList(
  meta: Frontmatter,
  key: string
): string[] | undefined {
  const value = meta[key];
  if (Array.isArray(value)) return value.length ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const labels = value
    .split(/[,，|]/)
    .map((label) => label.trim())
    .filter(Boolean);
  return labels.length ? labels : undefined;
}
