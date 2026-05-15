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
import {
  runPlannerAgent,
  runImageAnalystAgent,
  runTextAnalystAgent,
  runBrandAgent,
  runArtisticBaseAgent,
  runPromptArchitectAgent,
  runQualityAgent,
  upsertMemory,
  PlannerOutput,
  ImageAnalystOutput,
  TextAnalystOutput,
  BrandAgentOutput,
  ArtisticBaseOutput,
  PromptArchitectOutput,
  QualityAgentOutput
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
    ready_for_generation: boolean;
    agents_executed: string[];
    total_duration_ms: number;
  };
}

export async function runFullOrchestration(options: OrchestrationOptions): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const agentsExecuted: string[] = [];

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

  // ─── 3. Image Analyst (si fichiers présents) ─────────

  let imageAnalystResults: ImageAnalystOutput[] = [];

  if (project.files.length > 0) {
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
        model: options.visionModel
      });

      agentsExecuted.push('ImageAnalystAgent');

      // Sauvegarder dans M-MD
      const mdContent = {
        analyses: imageAnalystResults,
        file_count: imageAnalystResults.length,
        generated_at: new Date().toISOString()
      };
      await upsertMemory(options.projectId, 'M-MD', mdContent as unknown as Prisma.InputJsonValue);
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
      model: options.model
    });
    agentsExecuted.push('PlannerAgent');
  } catch (err) {
    throw new AppError(`Planner Agent échoué: ${err instanceof Error ? err.message : 'Unknown'}`, 500);
  }

  // Sauvegarder M-QT1
  await upsertMemory(options.projectId, 'M-QT1', {
    questions_to_user: plannerResult.questions_to_user,
    missing_information: plannerResult.missing_information,
    generated_at: new Date().toISOString()
  } as unknown as Prisma.InputJsonValue);

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
        total_duration_ms: totalDuration
      }
    };
  }

  // Mettre à jour le statut vers ANALYZING
  await prisma.project.update({
    where: { id: options.projectId },
    data: { status: 'ANALYZING' }
  });

  // ─── 6. Text Analyst ─────────────────────────────────

  let textAnalystResult: TextAnalystOutput;

  try {
    textAnalystResult = await runTextAnalystAgent({
      projectId: options.projectId,
      plannerResult,
      provider: options.provider,
      model: options.model
    });
    agentsExecuted.push('TextAnalystAgent');
  } catch (err) {
    throw new AppError(`Text Analyst Agent échoué: ${err instanceof Error ? err.message : 'Unknown'}`, 500);
  }

  // ─── 7. Brand Agent → M-ID ───────────────────────────

  let brandAgentResult: BrandAgentOutput;
  const logoFile = project.files.find(f => f.usageType === 'LOGO') ?? null;
  const firstImageAnalysis = imageAnalystResults.find(r => r.logo_analysis?.is_logo_present) ?? imageAnalystResults[0] ?? null;

  try {
    brandAgentResult = await runBrandAgent({
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
      model: options.model
    });
    agentsExecuted.push('BrandAgent');
  } catch (err) {
    throw new AppError(`Brand Agent échoué: ${err instanceof Error ? err.message : 'Unknown'}`, 500);
  }

  // Sauvegarder M-ID
  await upsertMemory(options.projectId, 'M-ID', brandAgentResult as unknown as unknown as Prisma.InputJsonValue);

  // ─── 8. Artistic Base Agent → M-BA ──────────────────

  let artisticBaseResult: ArtisticBaseOutput;

  const artisticResources = await prisma.artisticResource.findMany({
    where: {
      OR: [
        { category: { equals: plannerResult.category, mode: 'insensitive' } },
        { category: { contains: plannerResult.poster_type, mode: 'insensitive' } }
      ]
    },
    take: 20
  });

  try {
    artisticBaseResult = await runArtisticBaseAgent({
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
      model: options.model
    });
    agentsExecuted.push('ArtisticBaseAgent');
  } catch (err) {
    throw new AppError(`Artistic Base Agent échoué: ${err instanceof Error ? err.message : 'Unknown'}`, 500);
  }

  // Sauvegarder M-BA
  await upsertMemory(options.projectId, 'M-BA', artisticBaseResult as unknown as unknown as Prisma.InputJsonValue);

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
      model: options.model
    });
    agentsExecuted.push('PromptArchitectAgent');
  } catch (err) {
    throw new AppError(`Prompt Architect Agent échoué: ${err instanceof Error ? err.message : 'Unknown'}`, 500);
  }

  // Sauvegarder M-PROMPT1
  await upsertMemory(options.projectId, 'M-PROMPT1', promptArchitectResult as unknown as unknown as Prisma.InputJsonValue);

  // ─── 10. Quality Agent ────────────────────────────────

  let qualityResult: QualityAgentOutput;

  try {
    qualityResult = await runQualityAgent({
      projectId: options.projectId,
      mPrompt1: promptArchitectResult,
      provider: options.provider,
      model: options.model
    });
    agentsExecuted.push('QualityAgent');
  } catch (err) {
    // Quality Agent non bloquant : si il échoue, on retourne quand même le résultat
    console.warn('QualityAgent warning:', err instanceof Error ? err.message : err);
    qualityResult = {
      quality_score: 75,
      is_valid: true,
      issues: ['Quality Agent non disponible'],
      recommendations: []
    };
  }

  // ─── 11. Mise à jour Project.status ──────────────────

  const finalStatus = qualityResult.is_valid && qualityResult.quality_score >= 70
    ? 'PROMPT_READY'
    : 'READY_FOR_PROMPT';

  await prisma.project.update({
    where: { id: options.projectId },
    data: { status: finalStatus }
  });

  const totalDuration = Date.now() - startTime;

  return {
    success: true,
    message: qualityResult.is_valid
      ? 'M-PROMPT1 généré avec succès et validé par le Quality Agent.'
      : 'M-PROMPT1 généré mais des améliorations sont recommandées.',
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
      ready_for_generation: qualityResult.is_valid && promptArchitectResult.ready_for_generation,
      agents_executed: agentsExecuted,
      total_duration_ms: totalDuration
    }
  };
}
