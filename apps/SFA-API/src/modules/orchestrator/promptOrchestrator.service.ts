/**
 * Prompt Orchestrator Service
 *
 * Workflow complet des 7 agents pour générer M-PROMPT1.
 * Séquence :
 *   1. Vérification M-SMS
 *   2. Récupération des mémoires et fichiers
 *   3. Image Analyst (si fichiers présents)
 *   4. Planner Agent → M-QT1
 *   5. Si ready_for_next_step = false → early exit avec questions
 *   6. Text Analyst
 *   7. Brand Agent → M-ID
 *   8. Artistic Base Agent → M-BA
 *   9. Prompt Architect → M-PROMPT1
 *  10. Quality Agent
 *  11. Mise à jour Project.status
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { AIProvider } from '../ai/ai.types';
import { buildMemorySnapshot, type MemorySnapshot } from '../agents/dynamic-context.service';
import {
  orchestratorPipelineService,
  type OrchestratorPipelineConfig,
  type OrchestratorPipelineStep,
  type OrchestratorStepId,
} from './orchestratorPipeline.service';
import {
  runPlannerAgent,
  runImageAnalystAgent,
  runTextAnalystAgent,
  runBrandAgent,
  runArtisticBaseAgent,
  runPromptArchitectAgent,
  runQualityAgent,
  runSafetyAgent,
  upsertMemory,
  PlannerOutput,
  ImageAnalystOutput,
  TextAnalystOutput,
  BrandAgentOutput,
  ArtisticBaseOutput,
  PromptArchitectOutput,
  QualityAgentOutput,
  SafetyAgentOutput
} from '../agents/agents.service';

export interface OrchestrationOptions {
  travailId: string;
  userId: string;
  userRole: string;
  provider?: AIProvider;
  model?: string;
  visionProvider?: AIProvider;
  visionModel?: string;
  force?: boolean;
}

export interface OrchestrationResult {
  success: boolean;
  message: string;
  data: {
    travailId: string;
    status: string;
    questions_to_user?: string[];
    missing_information?: string[];
    final_prompt?: string;
    negative_prompt?: string;
    layout_reference_url?: string | null;
    style_reference_url?: string | null;
    quality?: QualityAgentOutput;
    quality_failed?: boolean;
    safety?: SafetyAgentOutput;
    ready_for_generation: boolean;
    agents_executed: string[];
    agents_skipped?: string[];
    agent_failures?: Array<{ agent: string; error: string }>;
    total_duration_ms: number;
  };
}

const CRITICAL_STEP_IDS = new Set<OrchestratorStepId>(['planning', 'prompt_architect']);

function getStep(config: OrchestratorPipelineConfig, id: OrchestratorStepId): OrchestratorPipelineStep {
  const step = config.steps.find((item) => item.id === id);
  if (!step) throw new AppError(`Étape orchestrateur manquante: ${id}`, 500);
  return step;
}

function stepOutputKey(step: OrchestratorPipelineStep, fallback: string): string {
  return step.outputMemoryKey?.trim() || fallback;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Unknown';
}

async function withStepPolicy<T>(
  step: OrchestratorPipelineStep,
  run: () => Promise<T>,
): Promise<T> {
  const attempts = Math.max(1, step.retries + 1);
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      if (step.timeoutMs <= 0) return await run();

      let timeout: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`${step.label} timeout après ${step.timeoutMs}ms`)),
          step.timeoutMs,
        );
      });

      try {
        return await Promise.race([run(), timeoutPromise]);
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    } catch (err) {
      lastError = err;
      if (attempt >= attempts) break;
      console.warn(`[orchestrator] ${step.label} retry ${attempt}/${attempts - 1}:`, errorMessage(err));
    }
  }

  throw lastError;
}

function shouldRunStep(
  step: OrchestratorPipelineStep,
  skippedStepIds: Set<OrchestratorStepId>,
  context: { hasFiles: boolean; plannerReady?: boolean; force?: boolean; hasPrompt?: boolean },
): boolean {
  if (!step.enabled || skippedStepIds.has(step.id)) return false;

  switch (step.condition) {
    case 'has_files':
      return context.hasFiles;
    case 'planner_ready_or_force':
      return Boolean(context.plannerReady || context.force);
    case 'has_prompt':
      return Boolean(context.hasPrompt);
    case 'always':
    default:
      return true;
  }
}

/**
 * Pre-flight check : avant de lancer un cycle, vérifie que tous les agents
 * marqués `required` dans le pipeline existent en DB et sont actifs. Retourne
 * la liste des agents optionnels indisponibles (pour info / `agents_skipped`).
 *
 * Pour un agent inactif marqué `required`, lève AppError(400) avec la liste
 * complète des défaillances pour faciliter le debug côté admin.
 */
async function validateActiveAgents(
  config: OrchestratorPipelineConfig,
): Promise<{ skipped: string[]; skippedStepIds: Set<OrchestratorStepId> }> {
  const allKeys = Array.from(new Set(config.steps.map((step) => step.agentKey).filter(Boolean)));
  const rows = await prisma.agentDefinition.findMany({
    where: { key: { in: allKeys } },
    select: { key: true, isActive: true },
  });
  const byKey = new Map(rows.map((r) => [r.key, r] as const));

  const missing: string[] = [];
  const inactiveRequired: string[] = [];
  const skipped: string[] = [];
  const skippedStepIds = new Set<OrchestratorStepId>();

  for (const step of config.steps) {
    const isCritical = CRITICAL_STEP_IDS.has(step.id);
    const isRequired = step.required || isCritical;

    if (!step.enabled) {
      if (isRequired) missing.push(`${step.agentKey} (étape désactivée)`);
      else {
        skipped.push(`${step.agentKey} (désactivé)`);
        skippedStepIds.add(step.id);
      }
      continue;
    }

    const row = byKey.get(step.agentKey);
    if (!row) {
      if (isRequired) missing.push(step.agentKey);
      else {
        skipped.push(`${step.agentKey} (absent)`);
        skippedStepIds.add(step.id);
      }
      continue;
    }

    if (!row.isActive) {
      if (isRequired) inactiveRequired.push(step.agentKey);
      else {
        skipped.push(`${step.agentKey} (inactif)`);
        skippedStepIds.add(step.id);
      }
    }
  }

  if (missing.length > 0 || inactiveRequired.length > 0) {
    const parts: string[] = [];
    if (missing.length) parts.push(`absents : ${missing.join(', ')}`);
    if (inactiveRequired.length) parts.push(`inactifs : ${inactiveRequired.join(', ')}`);
    throw new AppError(
      `Le pipeline ne peut pas démarrer — agents requis ${parts.join(' ; ')}. Activez-les dans /admin/agents.`,
      400,
    );
  }

  return { skipped, skippedStepIds };
}

export async function runFullOrchestration(options: OrchestrationOptions): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const agentsExecuted: string[] = [];
  const agentFailures: Array<{ agent: string; error: string }> = [];
  const pipelineConfig = await orchestratorPipelineService.getRuntimeConfig();

  // ─── 0. Pre-flight dynamique : valider le pipeline avant tout coût IA ───
  // Refuse de démarrer si un agent `required` est manquant ou inactif en DB.
  // Récupère la liste des `skipped` (agents optionnels désactivés) pour les
  // sauter explicitement plus bas.
  const preflight = await validateActiveAgents(pipelineConfig);
  const agentsSkipped: string[] = [...preflight.skipped];
  const skippedStepIds = preflight.skippedStepIds;

  const imageStep = getStep(pipelineConfig, 'image_analysis');
  const plannerStep = getStep(pipelineConfig, 'planning');
  const textStep = getStep(pipelineConfig, 'text_analysis');
  const brandStep = getStep(pipelineConfig, 'brand_analysis');
  const artisticStep = getStep(pipelineConfig, 'artistic_base');
  const promptStep = getStep(pipelineConfig, 'prompt_architect');
  const safetyStep = getStep(pipelineConfig, 'safety');
  const qualityStep = getStep(pipelineConfig, 'quality');

  // ─── 1. Vérification du travail et ownership ───────────

  const whereClause = options.userRole === 'ADMIN'
    ? { id: options.travailId }
    : { id: options.travailId, userId: options.userId };

  const travail = await prisma.travail.findFirst({
    where: whereClause,
    include: {
      memoryEntries: {
        include: { memoryDefinition: true }
      },
      files: true,
      project: { include: { files: true } }
    }
  });

  if (!travail) {
    throw new AppError('Travail not found or access denied', 404);
  }

  // Fichiers analysables = assets travail (références) + assets marque (logo, brand book)
  const allFiles = [...travail.files, ...travail.project.files];

  // ─── Snapshot mémoire partagé : évite à chaque agent de re-query Prisma
  // (gain ≈10-15 queries par cycle). Le snapshot est rebuild une fois après
  // chaque écriture orchestrateur (M_SMS, M_QT1, M_ID, M_BA, M_PROMPT1) pour
  // que les agents en aval voient les nouvelles entrées.
  let memorySnapshot: MemorySnapshot = buildMemorySnapshot(travail.memoryEntries);
  const refreshSnapshot = async () => {
    const fresh = await prisma.memoryEntry.findMany({
      where: { travailId: options.travailId },
      include: { memoryDefinition: { select: { key: true } } },
    });
    memorySnapshot = buildMemorySnapshot(fresh);
  };

  const persistStepMemory = async (
    step: OrchestratorPipelineStep,
    fallbackKey: string,
    content: Prisma.InputJsonValue,
  ) => {
    const memoryKey = stepOutputKey(step, fallbackKey);
    try {
      await upsertMemory(options.travailId, memoryKey, content);
    } catch (err) {
      const msg = `Mémoire ${memoryKey}: ${errorMessage(err)}`;
      if (step.required || CRITICAL_STEP_IDS.has(step.id)) throw new Error(msg);
      agentFailures.push({ agent: step.agentKey, error: msg });
      console.warn(`[orchestrator] ${step.label} memory write skipped:`, msg);
    }
  };

  // ─── 2. Auto-peupler M_SMS depuis M-CREATIVE-BRIEF si absent ────

  const mSmsEntry = travail.memoryEntries.find(
    (e) => e.memoryDefinition?.key === 'M_SMS'
  );
  if (!mSmsEntry) {
    const creativeBriefEntry = travail.memoryEntries.find(
      (e) => e.memoryDefinition?.key === 'M-CREATIVE-BRIEF'
    );
    if (creativeBriefEntry?.content) {
      const brief = creativeBriefEntry.content as Record<string, unknown>;
      const history = brief.conversationHistory as Array<{ role: string; content: string }> | undefined;
      const firstUserMessage = history?.find((m) => m.role === 'user')?.content;
      if (firstUserMessage) {
        try {
          await upsertMemory(options.travailId, 'M_SMS', {
            request: firstUserMessage,
            conversationHistory: history?.slice(0, 10),
            auto_populated: true,
            populated_at: new Date().toISOString(),
          } as unknown as Prisma.InputJsonValue);
          await refreshSnapshot();
        } catch (err) {
          agentFailures.push({ agent: 'orchestrator', error: `Mémoire M_SMS: ${errorMessage(err)}` });
          console.warn('[orchestrator] M_SMS auto-populate skipped:', errorMessage(err));
        }
      }
    }
  }

  // ─── 3. Image Analyst (si fichiers présents) ─────────

  let imageAnalystResults: ImageAnalystOutput[] = [];

  if (shouldRunStep(imageStep, skippedStepIds, { hasFiles: allFiles.length > 0 })) {
    try {
      imageAnalystResults = await withStepPolicy(imageStep, () =>
        runImageAnalystAgent({
          travailId: options.travailId,
          files: allFiles.map(f => ({
            id: f.id,
            fileUrl: f.fileUrl,
            fileType: f.fileType,
            originalName: f.originalName,
            usageType: f.usageType
          })),
          provider: options.visionProvider,
          model: options.visionModel,
          memorySnapshot,
          agentKey: imageStep.agentKey,
          inputMemoryKeys: imageStep.inputMemoryKeys,
        }),
      );

      agentsExecuted.push('ImageAnalystAgent');

      // Sauvegarder dans M-MD
      const mdContent = {
        analyses: imageAnalystResults,
        file_count: imageAnalystResults.length,
        generated_at: new Date().toISOString()
      };
      await persistStepMemory(imageStep, 'M_MD', mdContent as unknown as Prisma.InputJsonValue);
      await refreshSnapshot();
    } catch (err) {
      if (imageStep.required) {
        throw new AppError(`Image Analyst Agent échoué: ${errorMessage(err)}`, 500);
      }
      // Non bloquant : continuer même si l'analyse image échoue
      console.warn('ImageAnalystAgent warning:', err instanceof Error ? err.message : err);
    }
  } else if (allFiles.length === 0 && imageStep.enabled) {
    agentsSkipped.push(`${imageStep.agentKey} (condition has_files non remplie)`);
  }

  // ─── 4. Planner Agent ────────────────────────────────

  let plannerResult: PlannerOutput;

  try {
    plannerResult = await withStepPolicy(plannerStep, () =>
      runPlannerAgent({
        travailId: options.travailId,
        provider: options.provider,
        model: options.model,
        memorySnapshot,
        agentKey: plannerStep.agentKey,
        inputMemoryKeys: plannerStep.inputMemoryKeys,
      }),
    );
    agentsExecuted.push('PlannerAgent');
  } catch (err) {
    throw new AppError(`Planner Agent échoué: ${err instanceof Error ? err.message : 'Unknown'}`, 500);
  }

  // Sauvegarder M_QT1
  await persistStepMemory(plannerStep, 'M_QT1', {
    questions_to_user: plannerResult.questions_to_user,
    missing_information: plannerResult.missing_information,
    generated_at: new Date().toISOString()
  } as unknown as Prisma.InputJsonValue);
  await refreshSnapshot();

  // Mettre à jour le projet avec les métadonnées extraites
  await prisma.travail.update({
    where: { id: options.travailId },
    data: {
      status: 'QUESTIONING',
      posterType: plannerResult.poster_type || travail.posterType || null,
      category: plannerResult.category || travail.category || null,
      format: plannerResult.format || travail.format || null,
      style: plannerResult.style || travail.style || null
    }
  });

  // ─── 5. Early exit si informations insuffisantes ─────

  if (!plannerResult.ready_for_next_step && !options.force) {
    const totalDuration = Date.now() - startTime;

    return {
      success: true,
      message: 'Informations complémentaires nécessaires pour générer l\'affiche.',
      data: {
        travailId: options.travailId,
        status: 'QUESTIONING',
        questions_to_user: plannerResult.questions_to_user,
        missing_information: plannerResult.missing_information,
        ready_for_generation: false,
        agents_executed: agentsExecuted,
        agents_skipped: agentsSkipped.length ? agentsSkipped : undefined,
        total_duration_ms: totalDuration
      }
    };
  }

  // Mettre à jour le statut vers ANALYZING
  await prisma.travail.update({
    where: { id: options.travailId },
    data: { status: 'ANALYZING' }
  });

  // ─── 6-8. TextAnalyst + Brand + ArtisticBase en PARALLÈLE ───
  // Ces trois agents sont indépendants : aucun ne consomme l'output direct
  // d'un autre avant le Prompt Architect. On gagne 15-25 s par cycle.

  const logoFile = travail.project.files.find(f => f.usageType === 'LOGO') ?? null;
  const firstImageAnalysis = imageAnalystResults.find(r => r.logo_analysis?.is_logo_present) ?? imageAnalystResults[0] ?? null;

  // ArtisticResource query — récupéré une fois, partagé avec ArtisticBase.
  // On élargit progressivement le filtre : strict d'abord (category exact /
  // contains poster_type), puis fuzzy (chaque mot du category/poster_type/style
  // utilisé comme contains), puis fallback global (top 20 dernières maj) pour
  // éviter de passer 0 ressource à l'agent. Cf. AUDIT.md §5.
  async function fetchArtisticResources() {
    const strict = await prisma.artisticResource.findMany({
      where: {
        OR: [
          { category: { equals: plannerResult.category, mode: 'insensitive' } },
          { category: { contains: plannerResult.poster_type, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
    if (strict.length > 0) return strict;

    // Fuzzy : chaque mot >= 4 lettres de category/poster_type/style/objective
    const words = Array.from(
      new Set(
        [plannerResult.category, plannerResult.poster_type, plannerResult.style, plannerResult.objective]
          .filter(Boolean)
          .flatMap((s) => String(s).split(/\s+/))
          .map((w) => w.trim().toLowerCase())
          .filter((w) => w.length >= 4),
      ),
    );
    if (words.length > 0) {
      const fuzzy = await prisma.artisticResource.findMany({
        where: {
          OR: words.flatMap((w) => [
            { category: { contains: w, mode: 'insensitive' as const } },
            { title: { contains: w, mode: 'insensitive' as const } },
          ]),
        },
        take: 20,
      });
      if (fuzzy.length > 0) return fuzzy;
    }

    // Fallback global : on prend les 20 ressources les plus récentes pour que
    // l'agent ait au moins de quoi proposer + sélectionner une URL.
    return prisma.artisticResource.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
  }

  const artisticResources = await fetchArtisticResources();

  // ─── Soft-fail policy ───────────────────────────────────────────────────
  // TextAnalyst / Brand / ArtisticBase sont enrichissants mais pas vitaux :
  // si l'un échoue, on continue avec des valeurs par défaut et on trace la
  // défaillance dans agent_failures. Seul Prompt Architect (qui les consomme
  // typés) verra des données pauvres mais valides.
  // Planner et PromptArchitect restent en hard-throw (sans eux, pas de
  // M_PROMPT1 utilisable → la suite n'a pas de sens).

  let textAnalystResult: TextAnalystOutput = {
    main_title: '',
    subtitle: '',
    description: '',
    call_to_action: '',
    corrected_text: '',
    text_hierarchy: { level_1: '', level_2: '', level_3: '' },
  };

  let brandAgentResult: BrandAgentOutput = {
    brand_identity: {
      brand_name: '',
      logo_url: logoFile?.fileUrl ?? '',
      slogan: '',
      visual_style: '',
      typography: '',
      specific_elements: [],
    },
    m_contact: {
      company_name: '',
      phone: '', whatsapp: '', email: '',
      address: '', website: '', facebook: '', instagram: '',
    },
    m_colors: {
      primary: '', secondary: '', accent: '',
      extracted_colors: [], source: 'fallback',
    },
    missing_brand_information: [],
  };

  let artisticBaseResult: ArtisticBaseOutput = {
    recommended_models: [],
    recommended_textures: [],
    recommended_fonts: [],
    recommended_palettes: [],
    recommended_styles: [],
    selected_model_url: null,
    selected_style_url: null,
    forbidden_elements: [],
    quality_rules: [],
  };

  const designContext = {
    hasFiles: allFiles.length > 0,
    plannerReady: plannerResult.ready_for_next_step,
    force: options.force,
  };

  const designTasks = [
    {
      step: textStep,
      name: 'TextAnalystAgent',
      run: async () => {
        textAnalystResult = await withStepPolicy(textStep, () =>
          runTextAnalystAgent({
            travailId: options.travailId,
            plannerResult,
            provider: options.provider,
            model: options.model,
            memorySnapshot,
            agentKey: textStep.agentKey,
            inputMemoryKeys: textStep.inputMemoryKeys,
          }),
        );
      },
    },
    {
      step: brandStep,
      name: 'BrandAgent',
      run: async () => {
        brandAgentResult = await withStepPolicy(brandStep, () =>
          runBrandAgent({
            travailId: options.travailId,
            logoFile: logoFile
              ? {
                  id: logoFile.id,
                  fileUrl: logoFile.fileUrl,
                  fileType: logoFile.fileType,
                  originalName: logoFile.originalName,
                  usageType: logoFile.usageType
                }
              : null,
            imageAnalystResult: firstImageAnalysis,
            provider: options.provider,
            model: options.model,
            memorySnapshot,
            agentKey: brandStep.agentKey,
            inputMemoryKeys: brandStep.inputMemoryKeys,
          }),
        );
      },
    },
    {
      step: artisticStep,
      name: 'ArtisticBaseAgent',
      run: async () => {
        artisticBaseResult = await withStepPolicy(artisticStep, () =>
          runArtisticBaseAgent({
            travailId: options.travailId,
            plannerResult,
            artisticResources: artisticResources.map(r => ({
              id: r.id,
              title: r.title,
              category: r.category,
              resourceType: r.resourceType,
              description: r.description,
              tags: r.tags,
              content: r.content,
              url: r.url
            })),
            provider: options.provider,
            model: options.model,
            memorySnapshot,
            agentKey: artisticStep.agentKey,
            inputMemoryKeys: artisticStep.inputMemoryKeys,
          }),
        );
      },
    },
  ].sort((a, b) => a.step.order - b.step.order);

  const runnableDesignTasks = designTasks.filter((task) => {
    const shouldRun = shouldRunStep(task.step, skippedStepIds, designContext);
    if (!shouldRun && task.step.enabled && !skippedStepIds.has(task.step.id)) {
      agentsSkipped.push(`${task.step.agentKey} (condition ${task.step.condition} non remplie)`);
    }
    return shouldRun;
  });

  const runDesignTask = async (task: typeof designTasks[number]) => {
    try {
      await task.run();
      agentsExecuted.push(task.name);
    } catch (err) {
      const msg = errorMessage(err);
      if (task.step.required) {
        throw new AppError(`${task.name} échoué: ${msg}`, 500);
      }
      agentFailures.push({ agent: task.name, error: msg });
      console.warn(`[orchestrator] ${task.name} failed (soft-fail):`, msg);
    }
  };

  if (runnableDesignTasks.every((task) => task.step.executionMode === 'parallel')) {
    await Promise.all(runnableDesignTasks.map(runDesignTask));
  } else {
    for (const task of runnableDesignTasks) {
      await runDesignTask(task);
    }
  }

  if (brandStep.enabled && !skippedStepIds.has(brandStep.id)) {
    await persistStepMemory(brandStep, 'M_ID', brandAgentResult as unknown as Prisma.InputJsonValue);
  }
  if (artisticStep.enabled && !skippedStepIds.has(artisticStep.id)) {
    await persistStepMemory(artisticStep, 'M_BA', artisticBaseResult as unknown as Prisma.InputJsonValue);
  }
  await refreshSnapshot();

  // ─── 9. Prompt Architect → M-PROMPT1 ────────────────

  // Mettre à jour le statut
  await prisma.travail.update({
    where: { id: options.travailId },
    data: { status: 'READY_FOR_PROMPT' }
  });

  let promptArchitectResult: PromptArchitectOutput;

  try {
    promptArchitectResult = await withStepPolicy(promptStep, () =>
      runPromptArchitectAgent({
        travailId: options.travailId,
        plannerResult,
        textAnalystResult,
        brandAgentResult,
        artisticBaseResult,
        provider: options.provider,
        model: options.model,
        memorySnapshot,
        agentKey: promptStep.agentKey,
        inputMemoryKeys: promptStep.inputMemoryKeys,
      }),
    );
    agentsExecuted.push('PromptArchitectAgent');
  } catch (err) {
    throw new AppError(`Prompt Architect Agent échoué: ${err instanceof Error ? err.message : 'Unknown'}`, 500);
  }

  // Sauvegarder M_PROMPT1
  const promptMemoryKey = stepOutputKey(promptStep, 'M_PROMPT1');
  await persistStepMemory(promptStep, 'M_PROMPT1', promptArchitectResult as unknown as Prisma.InputJsonValue);
  await refreshSnapshot();

  // ─── 10. SAFETY AGENT (entre Prompt Architect et Quality) ─────────────
  // Filtre M_PROMPT1 contre les ForbiddenRule actives. Peut amender le prompt
  // ou bloquer la génération. Non bloquant en cas d'erreur agent (faute de
  // pouvoir évaluer, on laisse passer et on logue). Sauté proprement si
  // l'admin a désactivé l'agent SAFETY_AGENT (pre-flight l'a déjà détecté).

  let safetyResult: SafetyAgentOutput | undefined;
  if (!shouldRunStep(safetyStep, skippedStepIds, { hasFiles: allFiles.length > 0, hasPrompt: true })) {
    if (safetyStep.enabled && !skippedStepIds.has(safetyStep.id)) {
      agentsSkipped.push(`${safetyStep.agentKey} (condition ${safetyStep.condition} non remplie)`);
    }
    console.warn('[orchestrator] SAFETY_AGENT étape sautée');
  } else try {
    const activeRules = await prisma.forbiddenRule.findMany({
      where: { isActive: true },
      select: {
        key: true,
        title: true,
        category: true,
        severity: true,
        description: true,
        negativePrompt: true,
      },
    });
    safetyResult = await withStepPolicy(safetyStep, () =>
      runSafetyAgent({
        travailId: options.travailId,
        mPrompt1: promptArchitectResult,
        forbiddenRules: activeRules,
        provider: options.provider,
        model: options.model,
        memorySnapshot,
        agentKey: safetyStep.agentKey,
        inputMemoryKeys: safetyStep.inputMemoryKeys,
      }),
    );
    agentsExecuted.push('SafetyAgent');

    if (safetyResult.decision === 'blocked') {
      await prisma.travail.update({
        where: { id: options.travailId },
        data: { status: 'FAILED' },
      });
      const totalDuration = Date.now() - startTime;
      return {
        success: false,
        message:
          safetyResult.client_message ||
          'La génération a été bloquée car le prompt enfreint des règles de qualité ou de sécurité.',
        data: {
          travailId: options.travailId,
          status: 'FAILED',
          safety: safetyResult,
          ready_for_generation: false,
          agents_executed: agentsExecuted,
        agents_skipped: agentsSkipped.length ? agentsSkipped : undefined,
          agent_failures: agentFailures.length ? agentFailures : undefined,
          total_duration_ms: totalDuration,
        },
      };
    }

    if (safetyResult.decision === 'amended' && safetyResult.amended_prompt) {
      promptArchitectResult.final_prompt = safetyResult.amended_prompt;
      if (safetyResult.amended_negative_prompt_additions?.length) {
        promptArchitectResult.negative_prompt = [
          promptArchitectResult.negative_prompt || '',
          safetyResult.amended_negative_prompt_additions.join(', '),
        ]
          .filter(Boolean)
          .join(', ');
      }
      // Re-sauvegarder M_PROMPT1 avec les amendements Safety
      await persistStepMemory(
        safetyStep,
        promptMemoryKey,
        promptArchitectResult as unknown as Prisma.InputJsonValue,
      );
    }
  } catch (err) {
    if (safetyStep.required) {
      throw new AppError(`Safety Agent échoué: ${errorMessage(err)}`, 500);
    }
    // Safety non bloquant : on continue mais on trace la défaillance.
    agentFailures.push({
      agent: 'SafetyAgent',
      error: errorMessage(err),
    });
    console.warn('SafetyAgent warning:', err instanceof Error ? err.message : err);
  }

  // ─── 11. Quality Agent ────────────────────────────────
  // Échec visible : pas de score factice 75, le client sait que le score est
  // indisponible et peut décider lui-même de générer ou non.

  let qualityResult: QualityAgentOutput | undefined;
  let qualityFailed = false;

  if (!shouldRunStep(qualityStep, skippedStepIds, { hasFiles: allFiles.length > 0, hasPrompt: true })) {
    if (qualityStep.enabled && !skippedStepIds.has(qualityStep.id)) {
      agentsSkipped.push(`${qualityStep.agentKey} (condition ${qualityStep.condition} non remplie)`);
    }
    console.warn('[orchestrator] QUALITY_AGENT étape sautée');
  } else try {
    qualityResult = await withStepPolicy(qualityStep, () =>
      runQualityAgent({
        travailId: options.travailId,
        mPrompt1: promptArchitectResult,
        provider: options.provider,
        model: options.model,
        memorySnapshot,
        agentKey: qualityStep.agentKey,
        inputMemoryKeys: qualityStep.inputMemoryKeys,
      }),
    );
    agentsExecuted.push('QualityAgent');
  } catch (err) {
    if (qualityStep.required) {
      throw new AppError(`Quality Agent échoué: ${errorMessage(err)}`, 500);
    }
    qualityFailed = true;
    agentFailures.push({
      agent: 'QualityAgent',
      error: errorMessage(err),
    });
    console.warn('QualityAgent warning:', err instanceof Error ? err.message : err);
  }

  // Persister le quality_score dans M_PROMPT1 pour la quality gate de imageGen
  if (qualityResult) {
    await persistStepMemory(
      qualityStep,
      promptMemoryKey,
      {
        ...promptArchitectResult,
        quality_score: qualityResult.quality_score,
        quality_is_valid: qualityResult.is_valid,
      } as unknown as Prisma.InputJsonValue,
    );
  }

  // ─── 12. Mise à jour Project.status ──────────────────

  const promptValidated = qualityResult ? qualityResult.is_valid && qualityResult.quality_score >= 70 : false;
  const finalStatus = promptValidated ? 'PROMPT_READY' : 'READY_FOR_PROMPT';

  await prisma.travail.update({
    where: { id: options.travailId },
    data: { status: finalStatus }
  });

  const totalDuration = Date.now() - startTime;

  let messageOut: string;
  if (qualityFailed) {
    messageOut = 'M-PROMPT1 généré, mais le Quality Agent est indisponible — la qualité n\'a pas pu être validée automatiquement.';
  } else if (qualityResult?.is_valid) {
    messageOut = 'M-PROMPT1 généré avec succès et validé par le Quality Agent.';
  } else {
    messageOut = 'M-PROMPT1 généré mais des améliorations sont recommandées.';
  }

  return {
    success: true,
    message: messageOut,
    data: {
      travailId: options.travailId,
      status: finalStatus,
      questions_to_user: plannerResult.questions_to_user.length > 0 ? plannerResult.questions_to_user : undefined,
      missing_information: promptArchitectResult.missing_information.length > 0 ? promptArchitectResult.missing_information : undefined,
      final_prompt: promptArchitectResult.final_prompt,
      negative_prompt: promptArchitectResult.negative_prompt,
      layout_reference_url: artisticBaseResult.selected_model_url || null,
      style_reference_url: artisticBaseResult.selected_style_url || null,
      quality: qualityResult,
      quality_failed: qualityFailed || undefined,
      safety: safetyResult,
      ready_for_generation: Boolean(qualityResult?.is_valid && promptArchitectResult.ready_for_generation),
      agents_executed: agentsExecuted,
        agents_skipped: agentsSkipped.length ? agentsSkipped : undefined,
      agent_failures: agentFailures.length ? agentFailures : undefined,
      total_duration_ms: totalDuration
    }
  };
}
