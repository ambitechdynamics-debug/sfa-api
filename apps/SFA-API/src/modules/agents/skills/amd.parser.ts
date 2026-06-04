import matter from 'gray-matter';

export interface AmdParsed {
  name: string;
  description?: string;
  tags: string[];
  version?: string;
  content: string;
}

export type AmdParseErrorCode =
  | 'MISSING_FRONTMATTER'
  | 'MISSING_NAME'
  | 'INVALID_TAGS'
  | 'CONTENT_TOO_LONG'
  | 'YAML_PARSE';

export interface AmdParseError {
  code: AmdParseErrorCode;
  message: string;
}

export type AmdParseResult =
  | { ok: true; value: AmdParsed }
  | { ok: false; error: AmdParseError };

export const AMD_CONTENT_MAX_LENGTH = 20_000;

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Accept strings AND numbers for fields like `version: 1` (YAML coerces to number). */
function asLooseString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function normalizeTags(value: unknown): string[] | { error: AmdParseError } {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    return { error: { code: 'INVALID_TAGS', message: 'tags must be an array of strings.' } };
  }
  const out: string[] = [];
  for (const raw of value) {
    if (typeof raw !== 'string') {
      return { error: { code: 'INVALID_TAGS', message: 'tags must contain only strings.' } };
    }
    const trimmed = raw.trim();
    if (trimmed) out.push(trimmed);
  }
  return out;
}

/**
 * Parse a `.amd` skill file: YAML frontmatter + markdown body.
 * Used at paste/drag-drop time to pre-fill the admin form; not invoked
 * at save time (skill fields are already separated by then).
 */
export function parseAmd(raw: string): AmdParseResult {
  const hasFrontmatter = /^---\s*\r?\n/.test(raw);
  if (!hasFrontmatter) {
    return {
      ok: false,
      error: {
        code: 'MISSING_FRONTMATTER',
        message: 'Le fichier .amd doit commencer par un bloc YAML "---".',
      },
    };
  }

  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch (err) {
    return {
      ok: false,
      error: {
        code: 'YAML_PARSE',
        message: err instanceof Error ? err.message : 'Frontmatter YAML invalide.',
      },
    };
  }

  const data = parsed.data ?? {};
  const name = asString((data as Record<string, unknown>).name);
  if (!name) {
    return {
      ok: false,
      error: { code: 'MISSING_NAME', message: 'Le frontmatter doit définir un champ "name".' },
    };
  }

  const tagsResult = normalizeTags((data as Record<string, unknown>).tags);
  if (!Array.isArray(tagsResult)) return { ok: false, error: tagsResult.error };

  const description = asString((data as Record<string, unknown>).description);
  const version = asLooseString((data as Record<string, unknown>).version);
  const content = parsed.content.trim();

  if (content.length > AMD_CONTENT_MAX_LENGTH) {
    return {
      ok: false,
      error: {
        code: 'CONTENT_TOO_LONG',
        message: `Le corps du .amd dépasse ${AMD_CONTENT_MAX_LENGTH} caractères.`,
      },
    };
  }

  return {
    ok: true,
    value: { name, description, tags: tagsResult, version, content },
  };
}
