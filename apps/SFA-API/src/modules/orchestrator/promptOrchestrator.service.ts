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
  projectId: string;
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
    projectId: string;
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

// ─── Pipeline déclaratif (orchestration dynamique) ──────────────────────────
// `AgentDefinition` est désormais la source de vérité pour : isActive,
// provider et model. Chaque "stage" liste les clés d'agent à invoquer. Si un
// agent est marqué `required` et qu'il est inactif/manquant en DB, le
// pre-flight refuse le démarrage. Si un agent est `optional` et inactif, il
// est ignoré (avec trace dans `agents_skipped`).
//
// Modifier ce tableau permet de réordonner ou retirer des étapes sans toucher
// au code du runner principal. Pour ajouter un nouvel agent, déclarer un
// runner dans `STAGE_RUNNERS` ci-dessous et l'ajouter au pipeline.

type StageId =
  | 'analysis'
  | 'planning'
  | 'design'
  | 'composition'
  | 'safety'
  | 'validation';

interface PipelineAgent {
  key: string;
  required: boolean;
}

interface PipelineStage {
  id: StageId;
  /** `true` ⇒ tous les agents du stage s'exécutent en parallèle */
  parallel: boolean;
  agents: PipelineAgent[];
}

const PIPELINE: PipelineStage[] = [
  {
    id: 'analysis',
    parallel: false,
    agents: [{ key: 'IMAGE_ANALYST_AGENT', required: false }],
  },
  {
    id: 'planning',
    parallel: false,
    agents: [{ key: 'PLANNER_AGENT', required: true }],
  },
  {
    id: 'design',
    parallel: true,
    agents: [
      { key: 'TEXT_ANALYST_AGENT', required: true },
      { key: 'BRAND_AGENT', required: true },
      { key: 'ARTISTIC_BASE_AGENT', required: true },
    ],
  },
  {
    id: 'composition',
    parallel: false,
    agents: [{ key: 'PROMPT_ARCHITECT_AGENT', required: true }],
  },
  {
    id: 'safety',
    parallel: false,
    agents: [{ key: 'SAFETY_AGENT', required: false }],
  },
  {
    id: 'validation',
    parallel: false,
    agents: [{ key: 'QUALITY_AGENT', required: false }],
  },
];

/**
 * Pre-flight check : avant de lancer un cycle, vérifie que tous les agents
 * marqués `required` dans le pipeline existent en DB et sont actifs. Retourne
 * la liste des agents optionnels indisponibles (pour info / `agents_skipped`).
 *
 * Pour un agent inactif marqué `required`, lève AppError(400) avec la liste
 * complète des défaillances pour faciliter le debug côté admin.
 */
async function validateActiveAgents(): Promise<{ skipped: string[] }> {
  const allKeys = PIPELINE.flatMap((s) => s.agents.map((a) => a.key));
  const rows = await prisma.agentDefinition.findMany({
    where: { key: { in: allKeys } },
    select: { key: true, isActive: true },
  });
  const byKey = new Map(rows.map((r) => [r.key, r] as const));

  const missing: string[] = [];
  const inactiveRequired: string[] = [];
  const skipped: string[] = [];

  for (const stage of PIPELINE) {
    for (const a of stage.agents) {
      const row = byKey.get(a.key);
      if (!row) {
        (a.required ? missing : skipped).push(a.key);
        continue;
      }
      if (!row.isActive) {
        (a.required ? inactiveRequired : skipped).push(a.key);
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

  return { skipped };
}

export async function runFullOrchestration(options: OrchestrationOptions): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const agentsExecuted: string[] = [];

  // ─── 0. Pre-flight dynamique : valider le pipeline avant tout coût IA ───
  // Refuse de démarrer si un agent `required` est manquant ou inactif en DB.
  // Récupère la liste des `skipped` (agents optionnels désactivés) pour les
  // sauter explicitement plus bas.
  const { skipped: agentsSkipped } = await validateActiveAgents();
  const skipSet = new Set(agentsSkipped);

  // ─── 1. Vérification du projet et ownership ───────────

  const whereClause = options.userRole === 'ADMIN'
    ? { id: options.projectId }
    : { id: options.projectId, userId: options.userId };

  const project = await prisma.project.findFirst({
    where: whereClause,
    include: {
      memoryEntries: {
        include: { memoryDefinition: true }
      },
      files: true
    }
  });

  if (!project) {
    throw new AppError('Project not found or access denied', 404);
  }

  // ─── Snapshot mémoire partagé : évite à chaque agent de re-query Prisma
  // (gain ≈10-15 queries par cycle). Le snapshot est rebuild une fois après
  // chaque écriture orchestrateur (M_SMS, M_QT1, M_ID, M_BA, M_PROMPT1) pour
  // que les agents en aval voient les nouvelles entrées.
  let memorySnapshot: MemorySnapshot = buildMemorySnapshot(project.memoryEntries);
  const refreshSnapshot = async () => {
    const fresh = await prisma.memoryEntry.findMany({
      where: { projectId: options.projectId },
      include: { memoryDefinition: { select: { key: true } } },
    });
    memorySnapshot = buildMemorySnapshot(fresh);
  };

  // ─── 2. Auto-peupler M_SMS depuis M-CREATIVE-BRIEF si absent ────

  const mSmsEntry = project.memoryEntries.find(
    (e) => e.memoryDefinition?.key === 'M_SMS'
  );
  if (!mSmsEntry) {
    const creativeBriefEntry = project.memoryEntries.find(
      (e) => e.memoryDefinition?.key === 'M-CREATIVE-BRIEF'
    );
    if (creativeBriefEntry?.content) {
      const brief = creativeBriefEntry.content as Record<string, unknown>;
      const history = brief.conversationHistory as Array<{ role: string; content: string }> | undefined;
      const firstUserMessage = history?.find((m) => m.role === 'user')?.content;
      if (firstUserMessage) {
        await upsertMemory(options.projectId, 'M_SMS', {
          request: firstUserMessage,
          conversationHistory: history?.slice(0, 10),
          auto_populated: true,
          populated_at: new Date().toISOString(),
        } as unknown as Prisma.InputJsonValue);
        await refreshSnapshot();
      }
    }
  }

  // ─── 3. Image Analyst (si fichiers présents) ─────────

  let imageAnalystResults: ImageAnalystOutput[] = [];

  if (project.files.length > 0 && !skipSet.has('IMAGE_ANALYST_AGENT')) {
    try {
      imageAnalystResults = await runImageAnalystAgent({
        projectId: options.projectId,
        files: project.files.map(f => ({
          id: f.id,
          fileUrl: f.fileUrl,
          fileType: f.fileType,
          originalName: f.originalName,
          usageType: f.usageType
        })),
        provider: options.visionProvider,
        model: options.visionModel,
        memorySnapshot
      });

      agentsExecuted.push('ImageAnalystAgent');

      // Sauvegarder dans M-MD
      const mdContent = {
        analyses: imageAnalystResults,
        file_count: imageAnalystResults.length,
        generated_at: new Date().toISOString()
      };
      await upsertMemory(options.projectId, 'M_MD', mdContent as unknown as Prisma.InputJsonValue);
      await refreshSnapshot();
    } catch (err) {
      // Non bloquant : continuer même si l'analyse image échoue
      console.warn('ImageAnalystAgent warning:', err instanceof Error ? err.message : err);
    }
  }

  // ─── 4. Planner Agent ────────────────────────────────

  let plannerResult: PlannerOutput;

  try {
    plannerResult = await runPlannerAgent({
      projectId: options.projectId,
      provider: options.provider,
      model: options.model,
      memorySnapshot
    });
    agentsExecuted.push('PlannerAgent');
  } catch (err) {
    throw new AppError(`Planner Agent échoué: ${err instanceof Error ? err.message : 'Unknown'}`, 500);
  }

  // Sauvegarder M_QT1
  await upsertMemory(options.projectId, 'M_QT1', {
    questions_to_user: plannerResult.questions_to_user,
    missing_information: plannerResult.missing_information,
    generated_at: new Date().toISOString()
  } as unknown as Prisma.InputJsonValue);
  await refreshSnapshot();

  // Mettre à jour le projet avec les métadonnées extraites
  await prisma.project.update({
    where: { id: options.projectId },
    data: {
      status: 'QUESTIONING',
      posterType: plannerResult.poster_type || project.posterType || null,
      category: plannerResult.category || project.category || null,
      format: plannerResult.format || project.format || null,
      style: plannerResult.style || project.style || null
    }
  });

  // ─── 5. Early exit si informations insuffisantes ─────

  if (!plannerResult.ready_for_next_step && !options.force) {
    const totalDuration = Date.now() - startTime;

    return {
      success: true,
      message: 'Informations complémentaires nécessaires pour générer l\'affiche.',
      data: {
        projectId: options.projectId,
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
  await prisma.project.update({
    where: { id: options.projectId },
    data: { status: 'ANALYZING' }
  });

  // ─── 6-8. TextAnalyst + Brand + ArtisticBase en PARALLÈLE ───
  // Ces trois agents sont indépendants : aucun ne consomme l'output direct
  // d'un autre avant le Prompt Architect. On gagne 15-25 s par cycle.

  const logoFile = project.files.find(f => f.usageType === 'LOGO') ?? null;
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

  const [textSettled, brandSettled, artisticSettled] = await Promise.allSettled([
    runTextAnalystAgent({
      projectId: options.projectId,
      plannerResult,
      provider: options.provider,
      model: options.model,
      memorySnapshot
    }),
    runBrandAgent({
      projectId: options.projectId,
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
      memorySnapshot
    }),
    runArtisticBaseAgent({
      projectId: options.projectId,
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
      memorySnapshot
    })
  ]);

  const agentFailures: Array<{ agent: string; error: string }> = [];

  // ─── Soft-fail policy ───────────────────────────────────────────────────
  // TextAnalyst / Brand / ArtisticBase sont enrichissants mais pas vitaux :
  // si l'un échoue, on continue avec des valeurs par défaut et on trace la
  // défaillance dans agent_failures. Seul Prompt Architect (qui les consomme
  // typés) verra des données pauvres mais valides.
  // Planner et PromptArchitect restent en hard-throw (sans eux, pas de
  // M_PROMPT1 utilisable → la suite n'a pas de sens).

  let textAnalystResult: TextAnalystOutput;
  if (textSettled.status === 'rejected') {
    const msg = textSettled.reason instanceof Error ? textSettled.reason.message : 'Unknown';
    agentFailures.push({ agent: 'TextAnalystAgent', error: msg });
    console.warn('[orchestrator] TextAnalystAgent failed (soft-fail):', msg);
    textAnalystResult = {
      main_title: '',
      subtitle: '',
      description: '',
      call_to_action: '',
      corrected_text: '',
      text_hierarchy: { level_1: '', level_2: '', level_3: '' },
    };
  } else {
    textAnalystResult = textSettled.value;
    agentsExecuted.push('TextAnalystAgent');
  }

  let brandAgentResult: BrandAgentOutput;
  if (brandSettled.status === 'rejected') {
    const msg = brandSettled.reason instanceof Error ? brandSettled.reason.message : 'Unknown';
    agentFailures.push({ agent: 'BrandAgent', error: msg });
    console.warn('[orchestrator] BrandAgent failed (soft-fail):', msg);
    brandAgentResult = {
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
        extracted_colors: [], source: 'fallback (BrandAgent failed)',
      },
      missing_brand_information: ['BrandAgent did not respond — toutes les informations marque manquent'],
    };
  } else {
    brandAgentResult = brandSettled.value;
    agentsExecuted.push('BrandAgent');
  }
  await upsertMemory(options.projectId, 'M_ID', brandAgentResult as unknown as Prisma.InputJsonValue);

  let artisticBaseResult: ArtisticBaseOutput;
  if (artisticSettled.status === 'rejected') {
    const msg = artisticSettled.reason instanceof Error ? artisticSettled.reason.message : 'Unknown';
    agentFailures.push({ agent: 'ArtisticBaseAgent', error: msg });
    console.warn('[orchestrator] ArtisticBaseAgent failed (soft-fail):', msg);
    artisticBaseResult = {
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
  } else {
    artisticBaseResult = artisticSettled.value;
    agentsExecuted.push('ArtisticBaseAgent');
  }
  await upsertMemory(options.projectId, 'M_BA', artisticBaseResult as unknown as Prisma.InputJsonValue);
  await refreshSnapshot();

  // ─── 9. Prompt Architect → M-PROMPT1 ────────────────

  // Mettre à jour le statut
  await prisma.project.update({
    where: { id: options.projectId },
    data: { status: 'READY_FOR_PROMPT' }
  });

  let promptArchitectResult: PromptArchitectOutput;

  try {
    promptArchitectResult = await runPromptArchitectAgent({
      projectId: options.projectId,
      plannerResult,
      textAnalystResult,
      brandAgentResult,
      artisticBaseResult,
      provider: options.provider,
      model: options.model,
      memorySnapshot
    });
    agentsExecuted.push('PromptArchitectAgent');
  } catch (err) {
    throw new AppError(`Prompt Architect Agent échoué: ${err instanceof Error ? err.message : 'Unknown'}`, 500);
  }

  // Sauvegarder M_PROMPT1
  await upsertMemory(options.projectId, 'M_PROMPT1', promptArchitectResult as unknown as Prisma.InputJsonValue);
  await refreshSnapshot();

  // ─── 10. SAFETY AGENT (entre Prompt Architect et Quality) ─────────────
  // Filtre M_PROMPT1 contre les ForbiddenRule actives. Peut amender le prompt
  // ou bloquer la génération. Non bloquant en cas d'erreur agent (faute de
  // pouvoir évaluer, on laisse passer et on logue). Sauté proprement si
  // l'admin a désactivé l'agent SAFETY_AGENT (pre-flight l'a déjà détecté).

  let safetyResult: SafetyAgentOutput | undefined;
  if (skipSet.has('SAFETY_AGENT')) {
    console.warn('[orchestrator] SAFETY_AGENT inactif — étape sautée');
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
    safetyResult = await runSafetyAgent({
      projectId: options.projectId,
      mPrompt1: promptArchitectResult,
      forbiddenRules: activeRules,
      provider: options.provider,
      model: options.model,
      memorySnapshot,
    });
    agentsExecuted.push('SafetyAgent');

    if (safetyResult.decision === 'blocked') {
      await prisma.project.update({
        where: { id: options.projectId },
        data: { status: 'FAILED' },
      });
      const totalDuration = Date.now() - startTime;
      return {
        success: false,
        message:
          safetyResult.client_message ||
          'La génération a été bloquée car le prompt enfreint des règles de qualité ou de sécurité.',
        data: {
          projectId: options.projectId,
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
      await upsertMemory(
        options.projectId,
        'M_PROMPT1',
        promptArchitectResult as unknown as Prisma.InputJsonValue,
      );
    }
  } catch (err) {
    // Safety non bloquant : on continue mais on trace la défaillance.
    agentFailures.push({
      agent: 'SafetyAgent',
      error: err instanceof Error ? err.message : 'Unknown',
    });
    console.warn('SafetyAgent warning:', err instanceof Error ? err.message : err);
  }

  // ─── 11. Quality Agent ────────────────────────────────
  // Échec visible : pas de score factice 75, le client sait que le score est
  // indisponible et peut décider lui-même de générer ou non.

  let qualityResult: QualityAgentOutput | undefined;
  let qualityFailed = false;

  if (skipSet.has('QUALITY_AGENT')) {
    console.warn('[orchestrator] QUALITY_AGENT inactif — étape sautée');
  } else try {
    qualityResult = await runQualityAgent({
      projectId: options.projectId,
      mPrompt1: promptArchitectResult,
      provider: options.provider,
      model: options.model,
      memorySnapshot
    });
    agentsExecuted.push('QualityAgent');
  } catch (err) {
    qualityFailed = true;
    agentFailures.push({
      agent: 'QualityAgent',
      error: err instanceof Error ? err.message : 'Unknown',
    });
    console.warn('QualityAgent warning:', err instanceof Error ? err.message : err);
  }

  // Persister le quality_score dans M_PROMPT1 pour la quality gate de imageGen
  if (qualityResult) {
    await upsertMemory(
      options.projectId,
      'M_PROMPT1',
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

  await prisma.project.update({
    where: { id: options.projectId },
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
      projectId: options.projectId,
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
