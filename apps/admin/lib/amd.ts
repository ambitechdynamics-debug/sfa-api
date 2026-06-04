import yaml from 'js-yaml'

export interface AmdParsed {
  name: string
  description?: string
  tags: string[]
  version?: string
  content: string
}

export type AmdClientParseResult =
  | { ok: true; value: AmdParsed }
  | { ok: false; error: string }

export const AMD_CONTENT_MAX_LENGTH = 20_000

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeTags(value: unknown): string[] | null {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) return null
  const out: string[] = []
  for (const raw of value) {
    if (typeof raw !== 'string') return null
    const trimmed = raw.trim()
    if (trimmed) out.push(trimmed)
  }
  return out
}

export function parseAmdClient(raw: string): AmdClientParseResult {
  const match = FRONTMATTER_REGEX.exec(raw)
  if (!match) {
    return { ok: false, error: 'Le fichier .amd doit commencer par un bloc YAML "---".' }
  }

  let data: Record<string, unknown> = {}
  try {
    const loaded = yaml.load(match[1])
    if (loaded && typeof loaded === 'object' && !Array.isArray(loaded)) {
      data = loaded as Record<string, unknown>
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Frontmatter YAML invalide.' }
  }

  const name = asString(data.name)
  if (!name) return { ok: false, error: 'Le frontmatter doit définir un champ "name".' }

  const tags = normalizeTags(data.tags)
  if (tags === null) return { ok: false, error: 'tags doit être un tableau de chaînes.' }

  const description = asString(data.description)
  const version = asString(data.version)
  const content = raw.slice(match[0].length).trim()

  if (content.length > AMD_CONTENT_MAX_LENGTH) {
    return { ok: false, error: `Le corps du .amd dépasse ${AMD_CONTENT_MAX_LENGTH} caractères.` }
  }

  return { ok: true, value: { name, description, tags, version, content } }
}
