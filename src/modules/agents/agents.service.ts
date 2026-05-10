/**
 * Agents Service
 *
 * Logique métier de chaque agent IA.
 * Chaque méthode :
 *  1. Construit le userPrompt à partir du contexte du projet
 *  2. Appelle le service IA avec le bon provider/modèle
 *  3. Parse et retourne le résultat typé
 *  4. Crée une entrée AgentRun en base de données
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { callTextAI, callVisionAI } from '../ai/ai.service';
import { AIProvider, AIResponse } from '../ai/ai.types';


import { PLANNER_SYSTEM_PROMPT } from './system-prompts/planner.prompt';
import { IMAGE_ANALYST_SYSTEM_PROMPT } from './system-prompts/imageAnalyst.prompt';
import { TEXT_ANALYST_SYSTEM_PROMPT } from './system-prompts/textAnalyst.prompt';
import { BRAND_AGENT_SYSTEM_PROMPT } from './system-prompts/brandAgent.prompt';
import { ARTISTIC_BASE_SYSTEM_PROMPT } from './system-prompts/artisticBase.prompt';
import { PROMPT_ARCHITECT_SYSTEM_PROMPT } from './system-prompts/promptArchitect.prompt';
import { QUALITY_AGENT_SYSTEM_PROMPT } from './system-prompts/qualityAgent.prompt';

// ─── Types de sortie de chaque agent ────────────────────

export interface PlannerOutput {
  project_summary: string;
  poster_type: string;
  category: string;
  objective: string;
  target_audience: string;
  main_message: string;
  format: string;
  style: string;
  missing_information: string[];
  questions_to_user: string[];
  ready_for_next_step: boolean;
}

export interface ImageAnalystOutput {
  image_type: string;
  visual_style: string;
  main_colors: string[];
  secondary_colors: string[];
  color_codes: string[];
  typography_detected: string;
  layout_description: string;
  graphic_elements: string[];
  detected_text: string[];
  detected_contact_info: string[];
  logo_analysis: {
    is_logo_present: boolean;
    logo_position: string;
    logo_style: string;
    brand_feeling: string;
  };
  quality_observations: string[];
  design_constraints: string[];
  recommendations_for_creation: string[];
}

export interface TextAnalystOutput {
  main_title: string;
  subtitle: string;
  description: string;
  call_to_action: string;
  corrected_text: string;
  text_hierarchy: {
    level_1: string;
    level_2: string;
    level_3: string;
  };
}

export interface BrandAgentOutput {
  brand_identity: {
    brand_name: string;
    logo_url: string;
    slogan: string;
    visual_style: string;
    typography: string;
    specific_elements: string[];
  };
  m_contact: {
    company_name: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    website: string;
    facebook: string;
    instagram: string;
  };
  m_colors: {
    primary: string;
    secondary: string;
    accent: string;
    extracted_colors: string[];
    source: string;
  };
  missing_brand_information: string[];
}

export interface ArtisticBaseOutput {
  recommended_models: string[];
  recommended_textures: string[];
  recommended_fonts: string[];
  recommended_palettes: string[];
  recommended_styles: string[];
  forbidden_elements: string[];
  quality_rules: string[];
}

export interface PromptArchitectOutput {
  final_prompt: string;
  negative_prompt: string;
  poster_type: string;
  category: string;
  style: string;
  format: string;
  main_text: string;
  contact_info: string;
  colors: string[];
  visual_direction: string;
  quality_rules: string[];
  missing_information: string[];
  ready_for_generation: boolean;
}

export interface QualityAgentOutput {
  quality_score: number;
  is_valid: boolean;
  issues: string[];
  recommendations: string[];
}

// ─── Utilitaire de sauvegarde AgentRun ──────────────────

interface SaveAgentRunParams {
  projectId: string;
  agentName: string;
  provider: string;
  model: string;
  input: Prisma.InputJsonValue;
  output?: Prisma.InputJsonValue;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  error?: string;
  durationMs?: number;
}

async function saveAgentRun(params: SaveAgentRunParams) {
  return prisma.agentRun.create({
    data: {
      projectId: params.projectId,
      agentName: params.agentName,
      provider: params.provider,
      model: params.model,
      input: params.input,
      output: params.output ?? Prisma.JsonNull,
      status: params.status,
      error: params.error,
      durationMs: params.durationMs
    }
  });
}

async function upsertMemory(projectId: string, memoryKey: string, content: Prisma.InputJsonValue) {
  const def = await prisma.memoryDefinition.findUnique({ where: { key: memoryKey } });
  if (!def) throw new Error(`Memory definition ${memoryKey} not found`);

  // On a besoin de récupérer le projet pour avoir le userId (MemoryEntry requiert userId)
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } });
  if (!project) throw new Error(`Project ${projectId} not found`);

  return prisma.memoryEntry.upsert({
    where: { projectId_memoryDefinitionId: { projectId, memoryDefinitionId: def.id } },
    create: { projectId, memoryDefinitionId: def.id, userId: project.userId, content },
    update: { content }
  });
}

// ─── AGENT 1 : PLANNER ──────────────────────────────────

export interface RunPlannerParams {
  projectId: string;
  mSms: Record<string, unknown>;
  mQt2?: Record<string, unknown> | null;
  mMd?: Record<string, unknown> | null;
  mId?: Record<string, unknown> | null;
  provider?: AIProvider;
  model?: string;
}

export async function runPlannerAgent(params: RunPlannerParams): Promise<PlannerOutput> {
  const userPrompt = `
## Demande client (M-SMS)
${JSON.stringify(params.mSms, null, 2)}

${params.mQt2 ? `## Réponses client (M-QT2)\n${JSON.stringify(params.mQt2, null, 2)}` : ''}

${params.mMd ? `## Analyse du modèle/image (M-MD)\n${JSON.stringify(params.mMd, null, 2)}` : ''}

${params.mId ? `## Identité visuelle existante (M-ID)\n${JSON.stringify(params.mId, null, 2)}` : ''}

Analyse cette demande et retourne le JSON demandé.
  `.trim();

  let agentRunStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let agentError: string | undefined;
  let result: AIResponse | null = null;

  try {
    result = await callTextAI({
      provider: params.provider,
      model: params.model,
      systemPrompt: PLANNER_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.7,
      responseFormat: 'json'
    });
  } catch (err) {
    agentRunStatus = 'FAILED';
    agentError = err instanceof Error ? err.message : 'Unknown error';
  }

  await saveAgentRun({
    projectId: params.projectId,
    agentName: 'PlannerAgent',
    provider: result?.provider ?? params.provider ?? 'mock',
    model: result?.model ?? params.model ?? 'mock-text',
    input: { mSms: params.mSms, mQt2: params.mQt2 ?? null } as unknown as Prisma.InputJsonValue,
    output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
    status: agentRunStatus,
    error: agentError,
    durationMs: result?.durationMs
  });

  if (agentRunStatus === 'FAILED') throw new Error(`PlannerAgent failed: ${agentError}`);

  return result!.parsed as PlannerOutput;
}

// ─── AGENT 2 : IMAGE ANALYST ────────────────────────────

export interface FileInfo {
  id: string;
  fileUrl: string;
  fileType: string;
  originalName: string;
  usageType: string;
}

export interface RunImageAnalystParams {
  projectId: string;
  files: FileInfo[];
  mSms?: Record<string, unknown> | null;
  provider?: AIProvider;
  model?: string;
}

export async function runImageAnalystAgent(params: RunImageAnalystParams): Promise<ImageAnalystOutput[]> {
  const results: ImageAnalystOutput[] = [];

  for (const file of params.files) {
    const userPrompt = `
Analyse cette image de type "${file.usageType}" (fichier : ${file.originalName}).

${params.mSms ? `Contexte de la demande client :\n${JSON.stringify(params.mSms, null, 2)}` : ''}

Retourne le JSON d'analyse demandé.
    `.trim();

    let agentRunStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    let agentError: string | undefined;
    let result: AIResponse | null = null;

    try {
      result = await callVisionAI({
        provider: params.provider,
        model: params.model,
        systemPrompt: IMAGE_ANALYST_SYSTEM_PROMPT,
        userPrompt,
        imageUrls: [file.fileUrl],
        temperature: 0.3,
        responseFormat: 'json'
      });
    } catch (err) {
      agentRunStatus = 'FAILED';
      agentError = err instanceof Error ? err.message : 'Unknown error';
    }

    await saveAgentRun({
      projectId: params.projectId,
      agentName: 'ImageAnalystAgent',
      provider: result?.provider ?? params.provider ?? 'mock',
      model: result?.model ?? params.model ?? 'mock-vision',
      input: { fileId: file.id, fileUrl: file.fileUrl, usageType: file.usageType } as unknown as Prisma.InputJsonValue,
      output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
      status: agentRunStatus,
      error: agentError,
      durationMs: result?.durationMs
    });

    if (agentRunStatus === 'SUCCESS' && result) {
      results.push(result.parsed as ImageAnalystOutput);
    }
  }

  return results;
}

// ─── AGENT 3 : TEXT ANALYST ─────────────────────────────

export interface RunTextAnalystParams {
  projectId: string;
  mSms: Record<string, unknown>;
  mQt2?: Record<string, unknown> | null;
  plannerResult: PlannerOutput;
  provider?: AIProvider;
  model?: string;
}

export async function runTextAnalystAgent(params: RunTextAnalystParams): Promise<TextAnalystOutput> {
  const userPrompt = `
## Demande client (M-SMS)
${JSON.stringify(params.mSms, null, 2)}

${params.mQt2 ? `## Réponses client (M-QT2)\n${JSON.stringify(params.mQt2, null, 2)}` : ''}

## Analyse Planner
- Type d'affiche : ${params.plannerResult.poster_type}
- Message principal : ${params.plannerResult.main_message}
- Objectif : ${params.plannerResult.objective}

Corrige, améliore et hiérarchise les textes pour cette affiche.
  `.trim();

  let agentRunStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let agentError: string | undefined;
  let result: AIResponse | null = null;

  try {
    result = await callTextAI({
      provider: params.provider,
      model: params.model,
      systemPrompt: TEXT_ANALYST_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.5,
      responseFormat: 'json'
    });
  } catch (err) {
    agentRunStatus = 'FAILED';
    agentError = err instanceof Error ? err.message : 'Unknown error';
  }

  await saveAgentRun({
    projectId: params.projectId,
    agentName: 'TextAnalystAgent',
    provider: result?.provider ?? params.provider ?? 'mock',
    model: result?.model ?? params.model ?? 'mock-text',
    input: { mSms: params.mSms, plannerResult: params.plannerResult } as unknown as Prisma.InputJsonValue,
    output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
    status: agentRunStatus,
    error: agentError,
    durationMs: result?.durationMs
  });

  if (agentRunStatus === 'FAILED') throw new Error(`TextAnalystAgent failed: ${agentError}`);

  return result!.parsed as TextAnalystOutput;
}

// ─── AGENT 4 : BRAND AGENT ──────────────────────────────

export interface RunBrandAgentParams {
  projectId: string;
  mSms: Record<string, unknown>;
  mQt2?: Record<string, unknown> | null;
  mMd?: Record<string, unknown> | null;
  mId?: Record<string, unknown> | null;
  logoFile?: FileInfo | null;
  imageAnalystResult?: ImageAnalystOutput | null;
  provider?: AIProvider;
  model?: string;
}

export async function runBrandAgent(params: RunBrandAgentParams): Promise<BrandAgentOutput> {
  const userPrompt = `
## Demande client (M-SMS)
${JSON.stringify(params.mSms, null, 2)}

${params.mQt2 ? `## Réponses client (M-QT2)\n${JSON.stringify(params.mQt2, null, 2)}` : ''}

${params.mMd ? `## Analyse du modèle (M-MD)\n${JSON.stringify(params.mMd, null, 2)}` : ''}

${params.mId ? `## Identité visuelle existante (M-ID)\n${JSON.stringify(params.mId, null, 2)}` : ''}

${params.logoFile ? `## Logo disponible\nURL : ${params.logoFile.fileUrl}\nNom : ${params.logoFile.originalName}` : '## Aucun logo fourni'}

${params.imageAnalystResult ? `## Analyse visuelle du logo\n${JSON.stringify(params.imageAnalystResult, null, 2)}` : ''}

Structure l'identité visuelle complète et retourne le JSON demandé.
  `.trim();

  let agentRunStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let agentError: string | undefined;
  let result: AIResponse | null = null;

  try {
    result = await callTextAI({
      provider: params.provider,
      model: params.model,
      systemPrompt: BRAND_AGENT_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.4,
      responseFormat: 'json'
    });
  } catch (err) {
    agentRunStatus = 'FAILED';
    agentError = err instanceof Error ? err.message : 'Unknown error';
  }

  await saveAgentRun({
    projectId: params.projectId,
    agentName: 'BrandAgent',
    provider: result?.provider ?? params.provider ?? 'mock',
    model: result?.model ?? params.model ?? 'mock-text',
    input: { mSms: params.mSms, mQt2: params.mQt2 ?? null, logoFile: params.logoFile ?? null } as unknown as Prisma.InputJsonValue,
    output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
    status: agentRunStatus,
    error: agentError,
    durationMs: result?.durationMs
  });

  if (agentRunStatus === 'FAILED') throw new Error(`BrandAgent failed: ${agentError}`);

  return result!.parsed as BrandAgentOutput;
}

// ─── AGENT 5 : ARTISTIC BASE AGENT ──────────────────────

export interface ArtisticResourceInfo {
  id: string;
  title: string;
  category: string;
  resourceType: string;
  description?: string | null;
  tags?: unknown;
  content?: unknown;
  url?: string | null;
}

export interface RunArtisticBaseParams {
  projectId: string;
  plannerResult: PlannerOutput;
  artisticResources: ArtisticResourceInfo[];
  mBa?: Record<string, unknown> | null;
  provider?: AIProvider;
  model?: string;
}

export async function runArtisticBaseAgent(params: RunArtisticBaseParams): Promise<ArtisticBaseOutput> {
  const userPrompt = `
## Contexte du projet
- Type d'affiche : ${params.plannerResult.poster_type}
- Catégorie : ${params.plannerResult.category}
- Style souhaité : ${params.plannerResult.style}
- Objectif : ${params.plannerResult.objective}
- Public cible : ${params.plannerResult.target_audience}

## Ressources artistiques disponibles (${params.artisticResources.length} ressources)
${params.artisticResources.length > 0
  ? params.artisticResources.map(r => `- [${r.resourceType}] ${r.title} (${r.category}) : ${r.description ?? 'Pas de description'}`).join('\n')
  : 'Aucune ressource disponible dans la base artistique.'}

${params.mBa ? `## Base artistique existante (M-BA)\n${JSON.stringify(params.mBa, null, 2)}` : ''}

Sélectionne les ressources les plus appropriées et retourne le JSON demandé.
  `.trim();

  let agentRunStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let agentError: string | undefined;
  let result: AIResponse | null = null;

  try {
    result = await callTextAI({
      provider: params.provider,
      model: params.model,
      systemPrompt: ARTISTIC_BASE_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.5,
      responseFormat: 'json'
    });
  } catch (err) {
    agentRunStatus = 'FAILED';
    agentError = err instanceof Error ? err.message : 'Unknown error';
  }

  await saveAgentRun({
    projectId: params.projectId,
    agentName: 'ArtisticBaseAgent',
    provider: result?.provider ?? params.provider ?? 'mock',
    model: result?.model ?? params.model ?? 'mock-text',
    input: {
      posterType: params.plannerResult.poster_type,
      category: params.plannerResult.category,
      resourceCount: params.artisticResources.length
    } as unknown as Prisma.InputJsonValue,
    output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
    status: agentRunStatus,
    error: agentError,
    durationMs: result?.durationMs
  });

  if (agentRunStatus === 'FAILED') throw new Error(`ArtisticBaseAgent failed: ${agentError}`);

  return result!.parsed as ArtisticBaseOutput;
}

// ─── AGENT 6 : PROMPT ARCHITECT ─────────────────────────

export interface RunPromptArchitectParams {
  projectId: string;
  mSms: Record<string, unknown>;
  mQt1?: Record<string, unknown> | null;
  mQt2?: Record<string, unknown> | null;
  mMd?: Record<string, unknown> | null;
  mId?: Record<string, unknown> | null;
  mBa?: Record<string, unknown> | null;
  plannerResult: PlannerOutput;
  textAnalystResult: TextAnalystOutput;
  brandAgentResult: BrandAgentOutput;
  artisticBaseResult: ArtisticBaseOutput;
  provider?: AIProvider;
  model?: string;
}

export async function runPromptArchitectAgent(params: RunPromptArchitectParams): Promise<PromptArchitectOutput> {
  const userPrompt = `
## Demande client (M-SMS)
${JSON.stringify(params.mSms, null, 2)}

${params.mQt2 ? `## Réponses client (M-QT2)\n${JSON.stringify(params.mQt2, null, 2)}` : ''}

${params.mMd ? `## Analyse du modèle (M-MD)\n${JSON.stringify(params.mMd, null, 2)}` : ''}

${params.mId ? `## Identité visuelle (M-ID)\n${JSON.stringify(params.mId, null, 2)}` : ''}

${params.mBa ? `## Base artistique (M-BA)\n${JSON.stringify(params.mBa, null, 2)}` : ''}

## Résultat Planner Agent
${JSON.stringify(params.plannerResult, null, 2)}

## Résultat Text Analyst
${JSON.stringify(params.textAnalystResult, null, 2)}

## Résultat Brand Agent
${JSON.stringify(params.brandAgentResult, null, 2)}

## Résultat Artistic Base
${JSON.stringify(params.artisticBaseResult, null, 2)}

Génère le prompt final M-PROMPT1 professionnel pour cette affiche.
  `.trim();

  let agentRunStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let agentError: string | undefined;
  let result: AIResponse | null = null;

  try {
    result = await callTextAI({
      provider: params.provider,
      model: params.model,
      systemPrompt: PROMPT_ARCHITECT_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.6,
      responseFormat: 'json'
    });
  } catch (err) {
    agentRunStatus = 'FAILED';
    agentError = err instanceof Error ? err.message : 'Unknown error';
  }

  await saveAgentRun({
    projectId: params.projectId,
    agentName: 'PromptArchitectAgent',
    provider: result?.provider ?? params.provider ?? 'mock',
    model: result?.model ?? params.model ?? 'mock-text',
    input: {
      posterType: params.plannerResult.poster_type,
      brandName: params.brandAgentResult.brand_identity?.brand_name ?? ''
    } as unknown as Prisma.InputJsonValue,
    output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
    status: agentRunStatus,
    error: agentError,
    durationMs: result?.durationMs
  });

  if (agentRunStatus === 'FAILED') throw new Error(`PromptArchitectAgent failed: ${agentError}`);

  return result!.parsed as PromptArchitectOutput;
}

// ─── AGENT 7 : QUALITY AGENT ────────────────────────────

export interface RunQualityAgentParams {
  projectId: string;
  mPrompt1: PromptArchitectOutput;
  allMemories: Record<string, unknown>;
  provider?: AIProvider;
  model?: string;
}

export async function runQualityAgent(params: RunQualityAgentParams): Promise<QualityAgentOutput> {
  const userPrompt = `
## Prompt final M-PROMPT1 à évaluer
${JSON.stringify(params.mPrompt1, null, 2)}

## Contexte des mémoires du projet
${JSON.stringify(params.allMemories, null, 2)}

Évalue la qualité de ce prompt et retourne le JSON de validation demandé.
  `.trim();

  let agentRunStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let agentError: string | undefined;
  let result: AIResponse | null = null;

  try {
    result = await callTextAI({
      provider: params.provider,
      model: params.model,
      systemPrompt: QUALITY_AGENT_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.3,
      responseFormat: 'json'
    });
  } catch (err) {
    agentRunStatus = 'FAILED';
    agentError = err instanceof Error ? err.message : 'Unknown error';
  }

  await saveAgentRun({
    projectId: params.projectId,
    agentName: 'QualityAgent',
    provider: result?.provider ?? params.provider ?? 'mock',
    model: result?.model ?? params.model ?? 'mock-text',
    input: { promptReady: params.mPrompt1.ready_for_generation } as unknown as Prisma.InputJsonValue,
    output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
    status: agentRunStatus,
    error: agentError,
    durationMs: result?.durationMs
  });

  if (agentRunStatus === 'FAILED') throw new Error(`QualityAgent failed: ${agentError}`);

  return result!.parsed as QualityAgentOutput;
}

// Exports des helpers pour l'orchestrateur
export { upsertMemory, saveAgentRun };

