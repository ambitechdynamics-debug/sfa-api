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
import { buildAgentContext, saveAgentOutputs, type MemorySnapshot } from './dynamic-context.service';

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
  selected_model_url: string | null;
  selected_style_url: string | null;
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

export interface SafetyAgentViolation {
  rule_key: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category?: string;
  evidence?: string;
  action?: 'blocked' | 'amended_remove' | 'amended_replace';
}

export interface SafetyAgentOutput {
  decision: 'approved' | 'amended' | 'blocked';
  violations: SafetyAgentViolation[];
  amended_prompt?: string | null;
  amended_negative_prompt_additions?: string[];
  client_message?: string | null;
  ready_for_next_step: boolean;
}

// ─── Utilitaire de sauvegarde AgentRun ──────────────────

interface SaveAgentRunParams {
  travailId: string;
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
      travailId: params.travailId,
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

async function upsertMemory(travailId: string, memoryKey: string, content: Prisma.InputJsonValue) {
  const def = await prisma.memoryDefinition.findUnique({ where: { key: memoryKey } });
  if (!def) throw new Error(`Memory definition ${memoryKey} not found`);

  // userId est dénormalisé sur Travail — on évite un join pour ce read fréquent.
  const travail = await prisma.travail.findUnique({ where: { id: travailId }, select: { userId: true } });
  if (!travail) throw new Error(`Travail ${travailId} not found`);

  return prisma.memoryEntry.upsert({
    where: { travailId_memoryDefinitionId: { travailId, memoryDefinitionId: def.id } },
    create: { travailId, memoryDefinitionId: def.id, userId: travail.userId, content },
    update: { content }
  });
}

// ─── AGENT 1 : PLANNER ──────────────────────────────────

export interface RunPlannerParams {
  travailId: string;
  provider?: AIProvider;
  model?: string;
  memorySnapshot?: MemorySnapshot;
  agentKey?: string;
  inputMemoryKeys?: string[];
}

export async function runPlannerAgent(params: RunPlannerParams): Promise<PlannerOutput> {
  const agentKey = params.agentKey ?? 'PLANNER_AGENT';
  const { promptText, provider: agentProvider, model: agentModel, systemPrompt } = await buildAgentContext(agentKey, params.travailId, params.memorySnapshot, { inputMemoryKeys: params.inputMemoryKeys });
  const userPrompt = `${promptText}\n\nAnalyse cette demande et retourne le JSON demandé.`.trim();

  let agentRunStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let agentError: string | undefined;
  let result: AIResponse | null = null;

  try {
    result = await callTextAI({
      provider: params.provider || agentProvider,
      model: params.model || agentModel,
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      responseFormat: 'json'
    });
  } catch (err) {
    agentRunStatus = 'FAILED';
    agentError = err instanceof Error ? err.message : 'Unknown error';
  }

  await saveAgentRun({
    travailId: params.travailId,
    agentName: 'PlannerAgent',
    provider: result?.provider ?? params.provider ?? 'mock',
    model: result?.model ?? params.model ?? 'mock-text',
    input: { dynamicContext: true } as unknown as Prisma.InputJsonValue,
    output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
    status: agentRunStatus,
    error: agentError,
    durationMs: result?.durationMs
  });

  if (agentRunStatus === 'FAILED') throw new Error(`PlannerAgent failed: ${agentError}`);

  if (result && result.parsed) {
    await saveAgentOutputs(agentKey, params.travailId, result.parsed);
  }

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
  travailId: string;
  files: FileInfo[];
  provider?: AIProvider;
  model?: string;
  memorySnapshot?: MemorySnapshot;
  agentKey?: string;
  inputMemoryKeys?: string[];
}

export async function runImageAnalystAgent(params: RunImageAnalystParams): Promise<ImageAnalystOutput[]> {
  const agentKey = params.agentKey ?? 'IMAGE_ANALYST_AGENT';
  const { promptText, provider: agentProvider, model: agentModel, systemPrompt } = await buildAgentContext(agentKey, params.travailId, params.memorySnapshot, { inputMemoryKeys: params.inputMemoryKeys });
  const results: ImageAnalystOutput[] = [];

  for (const file of params.files) {
    const userPrompt = `
Analyse cette image de type "${file.usageType}" (fichier : ${file.originalName}).

${promptText}

Retourne le JSON d'analyse demandé.
    `.trim();

    let agentRunStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    let agentError: string | undefined;
    let result: AIResponse | null = null;

    try {
      result = await callVisionAI({
        provider: params.provider || agentProvider,
        model: params.model || agentModel,
        systemPrompt,
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
      travailId: params.travailId,
      agentName: 'ImageAnalystAgent',
      provider: result?.provider ?? params.provider ?? 'mock',
      model: result?.model ?? params.model ?? 'mock-vision',
      input: { fileId: file.id, fileUrl: file.fileUrl, usageType: file.usageType, dynamicContext: true } as unknown as Prisma.InputJsonValue,
      output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
      status: agentRunStatus,
      error: agentError,
      durationMs: result?.durationMs
    });

    if (agentRunStatus === 'SUCCESS' && result) {
      results.push(result.parsed as ImageAnalystOutput);
    }
  }

  await saveAgentOutputs(agentKey, params.travailId, results);

  return results;
}

// ─── AGENT 3 : TEXT ANALYST ─────────────────────────────

export interface RunTextAnalystParams {
  travailId: string;
  plannerResult: PlannerOutput;
  provider?: AIProvider;
  model?: string;
  memorySnapshot?: MemorySnapshot;
  agentKey?: string;
  inputMemoryKeys?: string[];
}

export async function runTextAnalystAgent(params: RunTextAnalystParams): Promise<TextAnalystOutput> {
  const agentKey = params.agentKey ?? 'TEXT_ANALYST_AGENT';
  const { promptText, provider: agentProvider, model: agentModel, systemPrompt } = await buildAgentContext(agentKey, params.travailId, params.memorySnapshot, { inputMemoryKeys: params.inputMemoryKeys });
  const userPrompt = `
${promptText}

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
      provider: params.provider || agentProvider,
      model: params.model || agentModel,
      systemPrompt,
      userPrompt,
      temperature: 0.5,
      responseFormat: 'json'
    });
  } catch (err) {
    agentRunStatus = 'FAILED';
    agentError = err instanceof Error ? err.message : 'Unknown error';
  }

  await saveAgentRun({
    travailId: params.travailId,
    agentName: 'TextAnalystAgent',
    provider: result?.provider ?? params.provider ?? 'mock',
    model: result?.model ?? params.model ?? 'mock-text',
    input: { plannerResult: params.plannerResult, dynamicContext: true } as unknown as Prisma.InputJsonValue,
    output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
    status: agentRunStatus,
    error: agentError,
    durationMs: result?.durationMs
  });

  if (agentRunStatus === 'FAILED') throw new Error(`TextAnalystAgent failed: ${agentError}`);

  if (result && result.parsed) {
    await saveAgentOutputs(agentKey, params.travailId, result.parsed);
  }

  return result!.parsed as TextAnalystOutput;
}

// ─── AGENT 4 : BRAND AGENT ──────────────────────────────

export interface RunBrandAgentParams {
  travailId: string;
  logoFile?: FileInfo | null;
  imageAnalystResult?: ImageAnalystOutput | null;
  provider?: AIProvider;
  model?: string;
  memorySnapshot?: MemorySnapshot;
  agentKey?: string;
  inputMemoryKeys?: string[];
}

export async function runBrandAgent(params: RunBrandAgentParams): Promise<BrandAgentOutput> {
  const agentKey = params.agentKey ?? 'BRAND_AGENT';
  const { promptText, provider: agentProvider, model: agentModel, systemPrompt } = await buildAgentContext(agentKey, params.travailId, params.memorySnapshot, { inputMemoryKeys: params.inputMemoryKeys });
  const userPrompt = `
${promptText}

${params.logoFile ? `## Logo disponible\nURL : ${params.logoFile.fileUrl}\nNom : ${params.logoFile.originalName}` : '## Aucun logo fourni'}

${params.imageAnalystResult ? `## Analyse visuelle du logo\n${JSON.stringify(params.imageAnalystResult, null, 2)}` : ''}

Structure l'identité visuelle complète et retourne le JSON demandé.
  `.trim();

  let agentRunStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let agentError: string | undefined;
  let result: AIResponse | null = null;

  try {
    result = await callTextAI({
      provider: params.provider || agentProvider,
      model: params.model || agentModel,
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      responseFormat: 'json'
    });
  } catch (err) {
    agentRunStatus = 'FAILED';
    agentError = err instanceof Error ? err.message : 'Unknown error';
  }

  await saveAgentRun({
    travailId: params.travailId,
    agentName: 'BrandAgent',
    provider: result?.provider ?? params.provider ?? 'mock',
    model: result?.model ?? params.model ?? 'mock-text',
    input: { logoFile: params.logoFile ?? null, dynamicContext: true } as unknown as Prisma.InputJsonValue,
    output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
    status: agentRunStatus,
    error: agentError,
    durationMs: result?.durationMs
  });

  if (agentRunStatus === 'FAILED') throw new Error(`BrandAgent failed: ${agentError}`);

  if (result && result.parsed) {
    await saveAgentOutputs(agentKey, params.travailId, result.parsed);
  }

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
  travailId: string;
  plannerResult: PlannerOutput;
  artisticResources: ArtisticResourceInfo[];
  provider?: AIProvider;
  model?: string;
  memorySnapshot?: MemorySnapshot;
  agentKey?: string;
  inputMemoryKeys?: string[];
}

export async function runArtisticBaseAgent(params: RunArtisticBaseParams): Promise<ArtisticBaseOutput> {
  const agentKey = params.agentKey ?? 'ARTISTIC_BASE_AGENT';
  const { promptText, provider: agentProvider, model: agentModel, systemPrompt } = await buildAgentContext(agentKey, params.travailId, params.memorySnapshot, { inputMemoryKeys: params.inputMemoryKeys });
  const userPrompt = `
${promptText}

## Contexte du projet
- Type d'affiche : ${params.plannerResult.poster_type}
- Catégorie : ${params.plannerResult.category}
- Style souhaité : ${params.plannerResult.style}
- Objectif : ${params.plannerResult.objective}
- Public cible : ${params.plannerResult.target_audience}

## Ressources artistiques disponibles (${params.artisticResources.length} ressources)
${params.artisticResources.length > 0
  ? params.artisticResources.map(r => `- [${r.resourceType}] "${r.title}" (URL: ${r.url || 'aucune'}) : ${r.description ?? 'Pas de description'}`).join('\n')
  : 'Aucune ressource disponible dans la base artistique.'}

Sélectionne les ressources les plus appropriées et retourne le JSON demandé.
  `.trim();

  let agentRunStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let agentError: string | undefined;
  let result: AIResponse | null = null;

  try {
    result = await callTextAI({
      provider: params.provider || agentProvider,
      model: params.model || agentModel,
      systemPrompt,
      userPrompt,
      temperature: 0.5,
      responseFormat: 'json'
    });
  } catch (err) {
    agentRunStatus = 'FAILED';
    agentError = err instanceof Error ? err.message : 'Unknown error';
  }

  await saveAgentRun({
    travailId: params.travailId,
    agentName: 'ArtisticBaseAgent',
    provider: result?.provider ?? params.provider ?? 'mock',
    model: result?.model ?? params.model ?? 'mock-text',
    input: {
      posterType: params.plannerResult.poster_type,
      category: params.plannerResult.category,
      resourceCount: params.artisticResources.length,
      dynamicContext: true
    } as unknown as Prisma.InputJsonValue,
    output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
    status: agentRunStatus,
    error: agentError,
    durationMs: result?.durationMs
  });

  if (agentRunStatus === 'FAILED') throw new Error(`ArtisticBaseAgent failed: ${agentError}`);

  if (result && result.parsed) {
    await saveAgentOutputs(agentKey, params.travailId, result.parsed);
  }

  return result!.parsed as ArtisticBaseOutput;
}

// ─── AGENT 6 : PROMPT ARCHITECT ─────────────────────────

export interface RunPromptArchitectParams {
  travailId: string;
  plannerResult: PlannerOutput;
  textAnalystResult: TextAnalystOutput;
  brandAgentResult: BrandAgentOutput;
  artisticBaseResult: ArtisticBaseOutput;
  provider?: AIProvider;
  model?: string;
  memorySnapshot?: MemorySnapshot;
  agentKey?: string;
  inputMemoryKeys?: string[];
}

export async function runPromptArchitectAgent(params: RunPromptArchitectParams): Promise<PromptArchitectOutput> {
  const agentKey = params.agentKey ?? 'PROMPT_ARCHITECT_AGENT';
  const { promptText, provider: agentProvider, model: agentModel, systemPrompt } = await buildAgentContext(agentKey, params.travailId, params.memorySnapshot, { inputMemoryKeys: params.inputMemoryKeys });
  const userPrompt = `
${promptText}

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
      provider: params.provider || agentProvider,
      model: params.model || agentModel,
      systemPrompt,
      userPrompt,
      temperature: 0.6,
      responseFormat: 'json'
    });
  } catch (err) {
    agentRunStatus = 'FAILED';
    agentError = err instanceof Error ? err.message : 'Unknown error';
  }

  await saveAgentRun({
    travailId: params.travailId,
    agentName: 'PromptArchitectAgent',
    provider: result?.provider ?? params.provider ?? 'mock',
    model: result?.model ?? params.model ?? 'mock-text',
    input: {
      posterType: params.plannerResult.poster_type,
      brandName: params.brandAgentResult.brand_identity?.brand_name ?? '',
      dynamicContext: true
    } as unknown as Prisma.InputJsonValue,
    output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
    status: agentRunStatus,
    error: agentError,
    durationMs: result?.durationMs
  });

  if (agentRunStatus === 'FAILED') throw new Error(`PromptArchitectAgent failed: ${agentError}`);

  if (result && result.parsed) {
    await saveAgentOutputs(agentKey, params.travailId, result.parsed);
  }

  return result!.parsed as PromptArchitectOutput;
}

// ─── AGENT 7 : QUALITY AGENT ────────────────────────────

export interface RunQualityAgentParams {
  travailId: string;
  mPrompt1: PromptArchitectOutput;
  provider?: AIProvider;
  model?: string;
  memorySnapshot?: MemorySnapshot;
  agentKey?: string;
  inputMemoryKeys?: string[];
}

export async function runQualityAgent(params: RunQualityAgentParams): Promise<QualityAgentOutput> {
  const agentKey = params.agentKey ?? 'QUALITY_AGENT';
  const { promptText, provider: agentProvider, model: agentModel, systemPrompt } = await buildAgentContext(agentKey, params.travailId, params.memorySnapshot, { inputMemoryKeys: params.inputMemoryKeys });
  const userPrompt = `
${promptText}

## Prompt final M-PROMPT1 à évaluer
${JSON.stringify(params.mPrompt1, null, 2)}

Évalue la qualité de ce prompt et retourne le JSON de validation demandé.
  `.trim();

  let agentRunStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let agentError: string | undefined;
  let result: AIResponse | null = null;

  try {
    result = await callTextAI({
      provider: params.provider || agentProvider,
      model: params.model || agentModel,
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      responseFormat: 'json'
    });
  } catch (err) {
    agentRunStatus = 'FAILED';
    agentError = err instanceof Error ? err.message : 'Unknown error';
  }

  await saveAgentRun({
    travailId: params.travailId,
    agentName: 'QualityAgent',
    provider: result?.provider ?? params.provider ?? 'mock',
    model: result?.model ?? params.model ?? 'mock-text',
    input: { promptReady: params.mPrompt1.ready_for_generation, dynamicContext: true } as unknown as Prisma.InputJsonValue,
    output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
    status: agentRunStatus,
    error: agentError,
    durationMs: result?.durationMs
  });

  if (agentRunStatus === 'FAILED') throw new Error(`QualityAgent failed: ${agentError}`);

  if (result && result.parsed) {
    await saveAgentOutputs(agentKey, params.travailId, result.parsed);
  }

  return result!.parsed as QualityAgentOutput;
}

// ─── AGENT 8 : SAFETY AGENT ─────────────────────────────

export interface RunSafetyAgentParams {
  travailId: string;
  mPrompt1: PromptArchitectOutput;
  /** Règles interdites actives (depuis ForbiddenRule en DB) à injecter en contexte */
  forbiddenRules?: Array<{
    key: string;
    title: string;
    category: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description?: string | null;
    negativePrompt?: string | null;
  }>;
  provider?: AIProvider;
  model?: string;
  memorySnapshot?: MemorySnapshot;
  agentKey?: string;
  inputMemoryKeys?: string[];
}

export async function runSafetyAgent(params: RunSafetyAgentParams): Promise<SafetyAgentOutput> {
  const agentKey = params.agentKey ?? 'SAFETY_AGENT';
  const { promptText, provider: agentProvider, model: agentModel, systemPrompt } = await buildAgentContext(agentKey, params.travailId, params.memorySnapshot, { inputMemoryKeys: params.inputMemoryKeys });

  const rulesBlock = (params.forbiddenRules ?? [])
    .map(
      (r) => `- [${r.severity}] ${r.key} (${r.category}) — ${r.title}${r.description ? ` :: ${r.description}` : ''}`,
    )
    .join('\n');

  const userPrompt = `
${promptText}

## Prompt final M_PROMPT1 à filtrer
${JSON.stringify(params.mPrompt1, null, 2)}

## Règles interdites actives (ForbiddenRule)
${rulesBlock || '(aucune règle active)'}

Analyse le prompt ci-dessus. Bloque si violation CRITICAL, amende si HIGH/MEDIUM/LOW. Retourne le JSON conforme au schéma demandé.
  `.trim();

  let agentRunStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let agentError: string | undefined;
  let result: AIResponse | null = null;

  try {
    result = await callTextAI({
      provider: params.provider || agentProvider,
      model: params.model || agentModel,
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      responseFormat: 'json',
    });
  } catch (err) {
    agentRunStatus = 'FAILED';
    agentError = err instanceof Error ? err.message : 'Unknown error';
  }

  await saveAgentRun({
    travailId: params.travailId,
    agentName: 'SafetyAgent',
    provider: result?.provider ?? params.provider ?? 'mock',
    model: result?.model ?? params.model ?? 'mock-text',
    input: {
      ruleCount: params.forbiddenRules?.length ?? 0,
      dynamicContext: true,
    } as unknown as Prisma.InputJsonValue,
    output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
    status: agentRunStatus,
    error: agentError,
    durationMs: result?.durationMs,
  });

  if (agentRunStatus === 'FAILED') throw new Error(`SafetyAgent failed: ${agentError}`);

  if (result && result.parsed) {
    await saveAgentOutputs(agentKey, params.travailId, result.parsed);
  }

  return result!.parsed as SafetyAgentOutput;
}

// ─── GENERIC AGENT ──────────────────────────────────────
// Runner schema-agnostique pour les agents définis par l'admin qui ne sont pas
// dans la liste canonique des 8 (Planner, ImageAnalyst, TextAnalyst, Brand,
// ArtisticBase, PromptArchitect, Safety, Quality). Permet aux agents Ideation,
// Copywriter, StyleDirector, LayoutOverlay, VisualCritic, Learning, etc.
// d'être invoqués dynamiquement par l'orchestrateur, en lisant la systemPrompt
// admin + les mémoires en input + les modules d'accès (artistic base, etc.).

export interface RunGenericAgentParams {
  travailId: string;
  agentKey: string;
  agentName?: string;
  provider?: AIProvider;
  model?: string;
  memorySnapshot?: MemorySnapshot;
  inputMemoryKeys?: string[];
  responseFormat?: 'json' | 'text';
}

export async function runGenericAgent(params: RunGenericAgentParams): Promise<unknown> {
  const { promptText, provider: agentProvider, model: agentModel, systemPrompt } = await buildAgentContext(
    params.agentKey,
    params.travailId,
    params.memorySnapshot,
    { inputMemoryKeys: params.inputMemoryKeys },
  );

  const responseFormat = params.responseFormat ?? 'json';
  const userPrompt = (responseFormat === 'json'
    ? `${promptText}\n\nProduis la réponse au format JSON strict.`
    : promptText
  ).trim();

  let agentRunStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let agentError: string | undefined;
  let result: AIResponse | null = null;

  try {
    result = await callTextAI({
      provider: params.provider || agentProvider,
      model: params.model || agentModel,
      systemPrompt,
      userPrompt,
      temperature: 0.6,
      responseFormat,
    });
  } catch (err) {
    agentRunStatus = 'FAILED';
    agentError = err instanceof Error ? err.message : 'Unknown error';
  }

  await saveAgentRun({
    travailId: params.travailId,
    agentName: params.agentName || params.agentKey,
    provider: result?.provider ?? params.provider ?? 'mock',
    model: result?.model ?? params.model ?? '',
    input: { dynamicContext: true, agentKey: params.agentKey } as unknown as Prisma.InputJsonValue,
    output: (result?.parsed ?? null) as unknown as Prisma.InputJsonValue,
    status: agentRunStatus,
    error: agentError,
    durationMs: result?.durationMs,
  });

  if (agentRunStatus === 'FAILED') throw new Error(`${params.agentKey} failed: ${agentError}`);

  if (result && result.parsed) {
    await saveAgentOutputs(params.agentKey, params.travailId, result.parsed as Prisma.InputJsonValue);
  }

  return result?.parsed ?? null;
}

// Exports des helpers pour l'orchestrateur
export { upsertMemory, saveAgentRun };
