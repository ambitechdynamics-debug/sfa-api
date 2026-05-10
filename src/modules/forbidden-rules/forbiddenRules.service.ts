import { ForbiddenRule, ForbiddenRuleCategory, ForbiddenRuleSeverity, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import {
  CreateForbiddenRuleInput,
  SearchForbiddenRulesQuery,
  UpdateForbiddenRuleInput
} from './forbiddenRules.validation';
import { ForbiddenRulesMemoryContent } from './forbiddenRules.types';

const toJsonInput = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;
const toNullableJsonInput = (value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull =>
  value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);

const buildPagination = (page: number, limit: number) => ({
  skip: (page - 1) * limit,
  take: limit
});

// ─── Default seed rules ───────────────────────────────────────────────────────
export const DEFAULT_FORBIDDEN_RULES: Array<Omit<CreateForbiddenRuleInput, 'isActive'> & { isActive?: boolean }> = [
  {
    key: 'FORBID_UNREADABLE_FONTS',
    title: 'Polices illisibles',
    description: 'Les polices ne doivent pas être illisibles ou trop décoratives, surtout pour les informations importantes.',
    category: 'TYPOGRAPHY',
    severity: 'HIGH',
    scope: 'GLOBAL',
    examples: ['Utiliser une police gothique pour un numéro de téléphone', 'Polices manuscrites pour une adresse'],
    correctionTips: ['Utiliser des polices sans-serif lisibles pour les contacts', 'Réserver les polices décoratives au titre uniquement'],
    negativePrompt: 'Éviter les polices illisibles ou trop décoratives pour les informations importantes.'
  },
  {
    key: 'FORBID_TINY_TEXT',
    title: 'Texte trop petit',
    description: 'Les textes ne doivent pas être trop petits, surtout pour les contacts, dates, prix et appels à l\'action.',
    category: 'TYPOGRAPHY',
    severity: 'HIGH',
    scope: 'GLOBAL',
    examples: ['Numéro de téléphone en taille 8', 'Prix en bas de l\'affiche en très petit'],
    correctionTips: ['Taille minimum 14pt pour les contacts', 'CTA en taille 24pt minimum'],
    negativePrompt: 'Éviter les textes trop petits, surtout pour les contacts, dates, prix et appels à l\'action.'
  },
  {
    key: 'FORBID_BUSY_BACKGROUND',
    title: 'Fond trop chargé',
    description: 'Le fond ne doit pas empêcher la lecture du texte par sa surcharge visuelle.',
    category: 'COMPOSITION',
    severity: 'HIGH',
    scope: 'GLOBAL',
    examples: ['Photo détaillée derrière un texte sans masque', 'Motif complexe sous un titre'],
    correctionTips: ['Ajouter un overlay sombre/clair sous le texte', 'Flouter le fond aux endroits critiques'],
    negativePrompt: 'Éviter les fonds trop chargés qui empêchent la lecture du texte.'
  },
  {
    key: 'FORBID_LOGO_DISTORTION',
    title: 'Logo déformé',
    description: 'Le logo ne doit jamais être étiré, compressé, rogné ou modifié de manière à perdre son identité visuelle.',
    category: 'LOGO',
    severity: 'CRITICAL',
    scope: 'GLOBAL',
    examples: ['Logo étiré horizontalement', 'Logo recoloré sans autorisation'],
    correctionTips: ['Conserver les proportions originales', 'Respecter la zone de protection du logo'],
    negativePrompt: 'Ne jamais déformer, étirer, rogner ou modifier le logo.'
  },
  {
    key: 'FORBID_BLURRY_IMAGES',
    title: 'Images floues',
    description: 'Les images utilisées doivent être nettes et de haute qualité.',
    category: 'IMAGE_QUALITY',
    severity: 'HIGH',
    scope: 'GLOBAL',
    examples: ['Photo agrandie au-delà de sa résolution', 'Image JPEG très compressée'],
    correctionTips: ['Utiliser des images de 300 dpi minimum pour le print', 'Vérifier la netteté avant intégration'],
    negativePrompt: 'Éviter les images floues, pixelisées ou mal découpées.'
  },
  {
    key: 'FORBID_LOW_CONTRAST',
    title: 'Contraste faible',
    description: 'Le contraste entre le texte et le fond doit garantir la lisibilité.',
    category: 'COLORS',
    severity: 'HIGH',
    scope: 'GLOBAL',
    examples: ['Texte gris clair sur fond blanc', 'Jaune pâle sur blanc'],
    correctionTips: ['Respecter le ratio WCAG AA minimum (4.5:1)', 'Tester en niveaux de gris'],
    negativePrompt: 'Éviter les textes avec un contraste faible par rapport au fond.'
  },
  {
    key: 'FORBID_AMATEUR_EFFECTS',
    title: 'Effets amateurs',
    description: 'Éviter les effets visuels qui dénotent un manque de maîtrise graphique.',
    category: 'EFFECTS',
    severity: 'MEDIUM',
    scope: 'GLOBAL',
    examples: ['Ombres portées noires épaisses', 'Glow néon non maîtrisé'],
    correctionTips: ['Limiter l\'usage des ombres', 'Préférer des effets subtils'],
    negativePrompt: 'Éviter les effets amateurs, ombres excessives, contours lourds et glow non maîtrisés.'
  },
  {
    key: 'FORBID_BAD_TEXTURES',
    title: 'Textures de mauvaise qualité',
    description: 'Les textures doivent être cohérentes avec le style et de bonne qualité.',
    category: 'TEXTURES',
    severity: 'MEDIUM',
    scope: 'GLOBAL',
    examples: ['Texture grunge sur design corporate', 'Texture bois pixelisée'],
    correctionTips: ['Choisir des textures haute résolution', 'Aligner la texture avec le style global'],
    negativePrompt: 'Éviter les textures de mauvaise qualité, pixelisées ou incohérentes avec le style.'
  },
  {
    key: 'FORBID_VISUAL_OVERLOAD',
    title: 'Surcharge visuelle',
    description: 'L\'affiche ne doit pas comporter trop d\'éléments visuels concurrents.',
    category: 'COMPOSITION',
    severity: 'HIGH',
    scope: 'GLOBAL',
    examples: ['Plus de 5 éléments décoratifs autour du titre', 'Multiples icônes non hiérarchisées'],
    correctionTips: ['Appliquer la règle "less is more"', 'Hiérarchiser visuellement avec une priorité claire'],
    negativePrompt: 'Éviter la surcharge visuelle et le trop grand nombre d\'éléments décoratifs.'
  },
  {
    key: 'FORBID_FAKE_INFORMATION',
    title: 'Informations inventées',
    description: 'Ne jamais générer ou inventer d\'informations commerciales (numéro, prix, date, adresse, email).',
    category: 'LEGAL_SECURITY',
    severity: 'CRITICAL',
    scope: 'GLOBAL',
    examples: ['Téléphone fictif généré par l\'IA', 'Prix ou date fabriqués'],
    correctionTips: ['N\'utiliser que les informations fournies par l\'utilisateur', 'Demander confirmation si une info manque'],
    negativePrompt: 'Ne jamais inventer de numéro de téléphone, adresse, email, prix, date, lieu ou information commerciale.'
  },
  {
    key: 'FORBID_SPELLING_ERRORS',
    title: 'Fautes d\'orthographe',
    description: 'Le texte final doit être exempt de fautes d\'orthographe et de typographie.',
    category: 'TEXT_CONTENT',
    severity: 'HIGH',
    scope: 'GLOBAL',
    examples: ['Promo écrite "promotion" avec deux M', 'Mauvaise apostrophe typographique'],
    correctionTips: ['Vérifier avec un correcteur', 'Utiliser les apostrophes typographiques (’)'],
    negativePrompt: 'Éviter les fautes d\'orthographe, de grammaire ou de typographie.'
  },
  {
    key: 'FORBID_BAD_ALIGNMENT',
    title: 'Mauvais alignement',
    description: 'Les éléments doivent être alignés de manière cohérente.',
    category: 'COMPOSITION',
    severity: 'MEDIUM',
    scope: 'GLOBAL',
    examples: ['Titre à gauche, sous-titre centré sans raison', 'Marges incohérentes'],
    correctionTips: ['Définir une grille de mise en page', 'Maintenir des marges cohérentes'],
    negativePrompt: 'Éviter les éléments mal alignés, les marges incohérentes et les blocs déséquilibrés.'
  }
];

// ─── Service ──────────────────────────────────────────────────────────────────
export const forbiddenRulesService = {
  /**
   * Create a new forbidden rule.
   */
  create: async (input: CreateForbiddenRuleInput, adminId?: string): Promise<ForbiddenRule> => {
    try {
      return await prisma.forbiddenRule.create({
        data: {
          key: input.key,
          title: input.title,
          description: input.description,
          category: input.category,
          severity: input.severity ?? 'MEDIUM',
          scope: input.scope ?? 'GLOBAL',
          appliesTo: input.appliesTo === undefined ? Prisma.JsonNull : toJsonInput(input.appliesTo),
          examples: input.examples === undefined ? Prisma.JsonNull : toJsonInput(input.examples),
          correctionTips: input.correctionTips === undefined ? Prisma.JsonNull : toJsonInput(input.correctionTips),
          negativePrompt: input.negativePrompt,
          isActive: input.isActive ?? true,
          createdById: adminId
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(`A forbidden rule with key '${input.key}' already exists`, 409);
      }
      throw error;
    }
  },

  /**
   * List forbidden rules with filters & pagination.
   */
  list: async (query: SearchForbiddenRulesQuery) => {
    const where: Prisma.ForbiddenRuleWhereInput = {
      category: query.category,
      severity: query.severity,
      scope: query.scope,
      isActive: query.isActive
    };

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { key: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } }
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.forbiddenRule.findMany({
        where,
        orderBy: [{ severity: 'desc' }, { updatedAt: 'desc' }],
        ...buildPagination(query.page, query.limit)
      }),
      prisma.forbiddenRule.count({ where })
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      }
    };
  },

  /**
   * Get one forbidden rule by id.
   */
  getById: async (id: string): Promise<ForbiddenRule> => {
    const rule = await prisma.forbiddenRule.findUnique({ where: { id } });
    if (!rule) throw new AppError('Forbidden rule not found', 404);
    return rule;
  },

  /**
   * Update a forbidden rule. System rules can only patch description / correctionTips / negativePrompt.
   */
  update: async (id: string, input: UpdateForbiddenRuleInput): Promise<ForbiddenRule> => {
    const existing = await forbiddenRulesService.getById(id);

    if (existing.isSystem) {
      const allowedKeys = ['description', 'correctionTips', 'negativePrompt'] as const;
      const submittedKeys = Object.keys(input) as Array<keyof UpdateForbiddenRuleInput>;
      const forbidden = submittedKeys.filter((k) => !allowedKeys.includes(k as typeof allowedKeys[number]));
      if (forbidden.length > 0) {
        throw new AppError(
          `System rule '${existing.key}' can only update: description, correctionTips, negativePrompt. Forbidden: ${forbidden.join(', ')}`,
          403
        );
      }
    }

    return prisma.forbiddenRule.update({
      where: { id },
      data: {
        key: input.key,
        title: input.title,
        description: input.description,
        category: input.category,
        severity: input.severity,
        scope: input.scope,
        appliesTo: input.appliesTo === undefined ? undefined : toNullableJsonInput(input.appliesTo),
        examples: input.examples === undefined ? undefined : toNullableJsonInput(input.examples),
        correctionTips: input.correctionTips === undefined ? undefined : toNullableJsonInput(input.correctionTips),
        negativePrompt: input.negativePrompt,
        isActive: input.isActive
      }
    });
  },

  /**
   * Delete a non-system forbidden rule.
   */
  delete: async (id: string) => {
    const existing = await forbiddenRulesService.getById(id);
    if (existing.isSystem) {
      throw new AppError(`System rule '${existing.key}' cannot be deleted (you can deactivate it instead)`, 403);
    }
    await prisma.forbiddenRule.delete({ where: { id } });
    return { id };
  },

  /**
   * Toggle active flag.
   */
  toggleStatus: async (id: string): Promise<ForbiddenRule> => {
    const existing = await forbiddenRulesService.getById(id);
    return prisma.forbiddenRule.update({
      where: { id },
      data: { isActive: !existing.isActive }
    });
  },

  /**
   * Get all active rules (used by AI agents).
   */
  getActive: async (filters?: { category?: ForbiddenRuleCategory; severity?: ForbiddenRuleSeverity }): Promise<ForbiddenRule[]> => {
    return prisma.forbiddenRule.findMany({
      where: {
        isActive: true,
        category: filters?.category,
        severity: filters?.severity
      },
      orderBy: [{ severity: 'desc' }, { title: 'asc' }]
    });
  },

  /**
   * Get rules grouped by category.
   */
  getByCategory: async (category: ForbiddenRuleCategory): Promise<ForbiddenRule[]> => {
    return prisma.forbiddenRule.findMany({
      where: { category, isActive: true },
      orderBy: [{ severity: 'desc' }, { title: 'asc' }]
    });
  },

  /**
   * Build a single negative_prompt phrase from active rules.
   * Used by Prompt Architect Agent and Quality Agent.
   */
  buildNegativePromptFromRules: async (filters?: {
    category?: ForbiddenRuleCategory;
    severity?: ForbiddenRuleSeverity;
    minSeverity?: ForbiddenRuleSeverity;
  }): Promise<string> => {
    const SEVERITY_RANK: Record<ForbiddenRuleSeverity, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4
    };
    const rules = await forbiddenRulesService.getActive(filters);
    const filtered = filters?.minSeverity
      ? rules.filter((r) => SEVERITY_RANK[r.severity] >= SEVERITY_RANK[filters.minSeverity!])
      : rules;

    return filtered
      .map((r) => (r.negativePrompt ?? '').trim())
      .filter((s) => s.length > 0)
      .join(' ');
  },

  /**
   * Sync all active rules into the global M-INTERDITS memory.
   * Creates the MemoryDefinition if it does not exist, and creates/updates a global
   * MemoryEntry (no projectId, content stored against the first ADMIN as owner).
   */
  syncToGlobalMemory: async (): Promise<{ definitionId: string; entryId: string | null; ruleCount: number }> => {
    const rules = await forbiddenRulesService.getActive();
    const negativePromptText = rules
      .map((r) => (r.negativePrompt ?? '').trim())
      .filter(Boolean)
      .join(' ');

    const memoryContent: ForbiddenRulesMemoryContent = {
      forbidden_status: 'active',
      source: 'database',
      rules: rules.map((r) => ({
        key: r.key,
        title: r.title,
        category: r.category,
        severity: r.severity,
        description: r.description,
        examples: Array.isArray(r.examples) ? r.examples : [],
        correctionTips: Array.isArray(r.correctionTips) ? r.correctionTips : [],
        negativePrompt: r.negativePrompt
      })),
      negative_prompt_text: negativePromptText,
      last_synced_at: new Date().toISOString()
    };

    // 1) Ensure MemoryDefinition M-INTERDITS exists
    const definition = await prisma.memoryDefinition.upsert({
      where: { key: 'M-INTERDITS' },
      update: {
        scope: 'GLOBAL',
        isActive: true,
        isSystem: true,
        schema: toJsonInput(memoryContent)
      },
      create: {
        key: 'M-INTERDITS',
        name: 'Mémoire des éléments interdits',
        description: 'Liste centralisée des règles interdites synchronisée depuis la base ForbiddenRule',
        scope: 'GLOBAL',
        isActive: true,
        isSystem: true,
        schema: toJsonInput(memoryContent)
      }
    });

    // 2) Best-effort global entry — needs an admin user as owner (MemoryEntry.userId required).
    //    If no admin exists, return without entry (definition still updated).
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
    if (!admin) {
      return { definitionId: definition.id, entryId: null, ruleCount: rules.length };
    }

    // GLOBAL entries don't have a projectId → can't use the (projectId, memoryDefinitionId) unique
    // constraint. Look up by definitionId + null projectId, then update or create.
    const existingEntry = await prisma.memoryEntry.findFirst({
      where: { memoryDefinitionId: definition.id, projectId: null }
    });

    const entry = existingEntry
      ? await prisma.memoryEntry.update({
          where: { id: existingEntry.id },
          data: { content: toJsonInput(memoryContent) }
        })
      : await prisma.memoryEntry.create({
          data: {
            memoryDefinitionId: definition.id,
            userId: admin.id,
            projectId: null,
            content: toJsonInput(memoryContent)
          }
        });

    return { definitionId: definition.id, entryId: entry.id, ruleCount: rules.length };
  },

  /**
   * Idempotent seed of the default rules. Safe to call multiple times.
   * System rules are flagged isSystem=true.
   */
  seedDefaults: async (): Promise<{ created: number; skipped: number }> => {
    let created = 0;
    let skipped = 0;
    for (const rule of DEFAULT_FORBIDDEN_RULES) {
      const exists = await prisma.forbiddenRule.findUnique({ where: { key: rule.key } });
      if (exists) {
        skipped++;
        continue;
      }
      await prisma.forbiddenRule.create({
        data: {
          key: rule.key,
          title: rule.title,
          description: rule.description,
          category: rule.category,
          severity: rule.severity ?? 'MEDIUM',
          scope: rule.scope ?? 'GLOBAL',
          examples: rule.examples ? toJsonInput(rule.examples) : Prisma.JsonNull,
          correctionTips: rule.correctionTips ? toJsonInput(rule.correctionTips) : Prisma.JsonNull,
          negativePrompt: rule.negativePrompt,
          isActive: true,
          isSystem: true
        }
      });
      created++;
    }
    return { created, skipped };
  }
};
