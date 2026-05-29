import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';

export type AgentModule = 'files' | 'artistic_base' | 'forbidden_rules' | 'creation_options';

export interface AgentModuleAccess {
  files: boolean;
  artistic_base: boolean;
  forbidden_rules: boolean;
  creation_options: boolean;
}

export const DEFAULT_AGENT_MODULE_ACCESS: AgentModuleAccess = {
  files: false,
  artistic_base: false,
  forbidden_rules: false,
  creation_options: false,
};

/**
 * Normalize an arbitrary value (typically `agent.moduleAccess` from a Json
 * Prisma column) into a strict AgentModuleAccess shape. All keys default to
 * `false` when missing — opt-in behavior.
 */
export function normalizeAgentModuleAccess(value: unknown): AgentModuleAccess {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_AGENT_MODULE_ACCESS };
  }
  const record = value as Record<string, unknown>;
  return {
    files: record.files === true,
    artistic_base: record.artistic_base === true,
    forbidden_rules: record.forbidden_rules === true,
    creation_options: record.creation_options === true,
  };
}

export const CHAT_FILE_USAGE_LABELS_DEFAULT: Record<string, string> = {
  LOGO: 'Logo',
  MODEL: 'Modèle',
  REFERENCE_IMAGE: "Image de référence",
  PRODUCT_IMAGE: 'Image produit',
  PERSON_IMAGE: 'Image personne',
  BRAND_GUIDELINE: 'Charte de marque',
  GENERATED_POSTER: 'Visuel généré',
  OTHER: 'Fichier',
};

/**
 * Build a textual inventory of the files attached to a travail (and its
 * parent project's brand assets). Empty string if no files.
 */
export async function buildFilesContextBlock(
  travailId: string,
  labels: Record<string, string> = CHAT_FILE_USAGE_LABELS_DEFAULT,
): Promise<string> {
  try {
    const files = await prisma.fileAsset.findMany({
      where: {
        OR: [
          { travailId },
          { project: { travaux: { some: { id: travailId } } } },
        ],
      },
      select: { originalName: true, usageType: true },
    });
    if (files.length === 0) return '';

    const byLabel = new Map<string, { label: string; count: number; names: string[] }>();
    for (const f of files) {
      const label = labels[f.usageType] ?? f.usageType;
      const item = byLabel.get(label) ?? { label, count: 0, names: [] };
      item.count++;
      if (item.names.length < 3) item.names.push(f.originalName);
      byLabel.set(label, item);
    }

    const lines = Array.from(byLabel.values())
      .map((it) => `  • ${it.label} : ${it.count} fichier${it.count > 1 ? 's' : ''}${it.names.length ? ` (${it.names.join(', ')})` : ''}`)
      .join('\n');

    return [
      '═══════════════════════════════════════',
      'FICHIERS DU CLIENT (inventaire)',
      '═══════════════════════════════════════',
      lines,
    ].join('\n');
  } catch (err) {
    logger.warn('[agent-modules] failed to load files for context', err);
    return '';
  }
}

/**
 * Top N artistic resources, filtered by category fuzzy-match if provided.
 */
export async function buildArtisticBaseContextBlock(category?: string | null): Promise<string> {
  const cat = category?.trim() || undefined;
  try {
    const where = cat ? { category: { contains: cat, mode: 'insensitive' as const } } : {};
    const items = await prisma.artisticResource.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 12,
      select: { title: true, category: true, resourceType: true, description: true },
    });
    if (items.length === 0) return '';

    const lines = items
      .map((r) => {
        const head = `${r.resourceType} · ${r.title}${r.category ? ` (${r.category})` : ''}`;
        const desc = r.description?.trim() ? ` — ${r.description.trim().slice(0, 120)}` : '';
        return `  • ${head}${desc}`;
      })
      .join('\n');

    return [
      '═══════════════════════════════════════',
      `BASE ARTISTIQUE DISPONIBLE${cat ? ` (filtre catégorie : ${cat})` : ''}`,
      '═══════════════════════════════════════',
      'Tu peux suggérer ou t\'inspirer de ces ressources si pertinent (styles, palettes, polices, modèles) :',
      lines,
    ].join('\n');
  } catch (err) {
    logger.warn('[agent-modules] failed to load artistic base', err);
    return '';
  }
}

/**
 * Active forbidden rules ordered by severity desc.
 */
export async function buildForbiddenRulesContextBlock(): Promise<string> {
  try {
    const rules = await prisma.forbiddenRule.findMany({
      where: { isActive: true },
      orderBy: [{ severity: 'desc' }, { title: 'asc' }],
      take: 30,
      select: { title: true, category: true, severity: true, description: true },
    });
    if (rules.length === 0) return '';

    const lines = rules
      .map((r) => {
        const head = `[${r.severity}] ${r.title} · ${r.category}`;
        const desc = r.description?.trim() ? ` — ${r.description.trim().slice(0, 140)}` : '';
        return `  • ${head}${desc}`;
      })
      .join('\n');

    return [
      '═══════════════════════════════════════',
      'RÈGLES INTERDITES (à ne jamais suggérer / valider / produire)',
      '═══════════════════════════════════════',
      "Si une demande tombe dans l'une de ces règles, refuse poliment et propose une alternative :",
      lines,
    ].join('\n');
  } catch (err) {
    logger.warn('[agent-modules] failed to load forbidden rules', err);
    return '';
  }
}

/**
 * Context prompt of the CreationOption matching the travail's posterType slug.
 */
export async function buildCreationOptionContextBlock(posterType?: string | null): Promise<string> {
  const slug = posterType?.trim();
  if (!slug) return '';
  try {
    const option = await prisma.creationOption.findUnique({
      where: { slug },
      select: { name: true, contextPrompt: true, isActive: true },
    });
    if (!option || !option.isActive || !option.contextPrompt?.trim()) return '';

    return [
      '═══════════════════════════════════════',
      `CONTEXTE SPÉCIFIQUE (TYPE DE CRÉATION : ${option.name})`,
      '═══════════════════════════════════════',
      option.contextPrompt,
    ].join('\n');
  } catch (err) {
    logger.warn('[agent-modules] failed to load creation option', err);
    return '';
  }
}

/**
 * Compose the enabled blocks for a given access policy + travail context.
 * Returns a single string ready to append to the system prompt (empty if
 * no module is enabled or no data is available).
 */
export async function buildAgentModuleBlocks(
  access: AgentModuleAccess,
  ctx: { travailId: string; category?: string | null; posterType?: string | null },
): Promise<string> {
  const blocks: string[] = [];

  if (access.files) {
    const block = await buildFilesContextBlock(ctx.travailId);
    if (block) blocks.push(block);
  }
  if (access.artistic_base) {
    const block = await buildArtisticBaseContextBlock(ctx.category);
    if (block) blocks.push(block);
  }
  if (access.forbidden_rules) {
    const block = await buildForbiddenRulesContextBlock();
    if (block) blocks.push(block);
  }
  if (access.creation_options) {
    const block = await buildCreationOptionContextBlock(ctx.posterType);
    if (block) blocks.push(block);
  }

  return blocks.join('\n\n');
}
