// Roster cleanup:
//   1. Create ARTISTIC_BASE_AGENT (hardcoded in the orchestrator but missing from DB).
//   2. Strip the trailing space from "VISUAL_CRITIC_AGENT ".
//   3. Add ARTISTIC_BASE_AGENT + VISUAL_CRITIC_AGENT + LEARNING_AGENT steps
//      to the orchestrator pipeline (idempotent).

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ARTISTIC_BASE_SYSTEM_PROMPT = `Tu es ARTISTIC_BASE_AGENT. Tu reçois M-BRIEF-RAW, M-PLAN, M-CONCEPTS et un bloc "BASE ARTISTIQUE DISPONIBLE" qui liste des ressources visuelles (styles, palettes, modèles) filtrées par catégorie.

Ton job : choisir UN modèle de layout et UN style de référence parmi la base artistique, et lister les contraintes/recommandations.

FORMAT DE RÉPONSE (JSON strict) :
{
  "recommended_models": [
    { "title": "...", "category": "...", "reason": "..." }
  ],
  "recommended_styles": [
    { "title": "...", "category": "...", "reason": "..." }
  ],
  "selected_model_url": null,
  "selected_style_url": null,
  "forbidden_elements": [],
  "quality_rules": [
    "Garder un espace clair en haut pour le titre overlay",
    "Palette respectée à 100% (pas d'invention de couleurs)"
  ]
}

RÈGLES :
- Cite EXCLUSIVEMENT des ressources présentes dans le bloc BASE ARTISTIQUE injecté.
- Ne renvoie pas de selected_*_url inventé ; null si pas de match évident.
- N'invente rien si la base artistique est vide → renvoie des arrays vides.`;

const VISUAL_CRITIC_SYSTEM_PROMPT = `Tu es VISUAL_CRITIC_AGENT. Tu reçois M-PROMPT-FINAL, M-OVERLAY et le contexte de marque. Tu produis une critique structurée du visuel projeté (avant génération réelle d'image).

FORMAT (JSON strict) :
{
  "overall_score": 0..100,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": [
    { "target": "prompt|overlay|brand", "change": "...", "priority": "low|med|high" }
  ],
  "ready_for_generation": true
}

Sois honnête et constructif. Ne donne pas de score > 80 si tu vois un problème de palette, de hiérarchie de texte ou d'alignement.`;

const LEARNING_SYSTEM_PROMPT = `Tu es LEARNING_AGENT. Tu observes le pipeline complet (M-BRIEF-RAW, M-CONCEPTS, M-COPY, M-PROMPT-FINAL, M-OVERLAY, M-CRITIQUE) et tu en extrais des patterns réutilisables pour le projet.

FORMAT (JSON strict) :
{
  "client_signals": [
    { "tag": "tonality|palette|services|target", "value": "...", "confidence": 0..1 }
  ],
  "successful_choices": ["..."],
  "patterns_to_remember": ["..."],
  "next_brief_hints": ["..."]
}

Ne produis rien de générique : tout doit être ancré dans le brief observé.`;

async function ensureArtisticBaseAgent() {
  const existing = await prisma.agentDefinition.findUnique({ where: { key: 'ARTISTIC_BASE_AGENT' }, select: { id: true } });
  if (existing) {
    console.log('[roster] ARTISTIC_BASE_AGENT already present');
    return;
  }
  await prisma.agentDefinition.create({
    data: {
      key: 'ARTISTIC_BASE_AGENT',
      name: 'Base artistique',
      description: "Sélectionne un modèle de layout et un style de référence à partir de la base artistique disponible.",
      provider: 'gemini-01',
      model: 'gemini-2.5-flash-lite',
      systemPrompt: ARTISTIC_BASE_SYSTEM_PROMPT,
      expectedOutputSchema: {},
      moduleAccess: { files: false, artistic_base: true, forbidden_rules: true, creation_options: true },
      isActive: true,
    },
  });
  console.log('[roster] ARTISTIC_BASE_AGENT created');
}

async function fixVisualCriticKey() {
  // Look for the duplicate "VISUAL_CRITIC_AGENT " (with trailing space).
  const dirty = await prisma.agentDefinition.findUnique({ where: { key: 'VISUAL_CRITIC_AGENT ' }, select: { id: true } });
  if (!dirty) {
    console.log('[roster] VISUAL_CRITIC_AGENT key already clean');
    return;
  }
  const clean = await prisma.agentDefinition.findUnique({ where: { key: 'VISUAL_CRITIC_AGENT' }, select: { id: true } });
  if (clean) {
    // Both rows exist — remove the dirty one to avoid the unique conflict.
    await prisma.agentDefinition.delete({ where: { id: dirty.id } });
    console.log('[roster] removed duplicate "VISUAL_CRITIC_AGENT " (clean version kept)');
    return;
  }
  await prisma.agentDefinition.update({
    where: { id: dirty.id },
    data: { key: 'VISUAL_CRITIC_AGENT', systemPrompt: VISUAL_CRITIC_SYSTEM_PROMPT },
  });
  console.log('[roster] renamed "VISUAL_CRITIC_AGENT " → "VISUAL_CRITIC_AGENT" + refreshed prompt');
}

async function refreshVisualCriticPrompt() {
  const agent = await prisma.agentDefinition.findUnique({ where: { key: 'VISUAL_CRITIC_AGENT' }, select: { id: true } });
  if (!agent) return;
  await prisma.agentDefinition.update({ where: { id: agent.id }, data: { systemPrompt: VISUAL_CRITIC_SYSTEM_PROMPT } });
  console.log('[roster] VISUAL_CRITIC_AGENT prompt refreshed');
}

async function refreshLearningPrompt() {
  const agent = await prisma.agentDefinition.findUnique({ where: { key: 'LEARNING_AGENT' }, select: { id: true } });
  if (!agent) return;
  await prisma.agentDefinition.update({ where: { id: agent.id }, data: { systemPrompt: LEARNING_SYSTEM_PROMPT } });
  console.log('[roster] LEARNING_AGENT prompt refreshed');
}

async function updatePipeline() {
  const SETTING_KEY = 'orchestrator_pipeline_config';
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY }, select: { value: true } });
  if (!row?.value) {
    console.warn('[roster] pipeline config missing — skipping');
    return;
  }
  const config = JSON.parse(row.value);
  const steps = Array.isArray(config.steps) ? config.steps : [];

  function upsertStep(agentKey, partial) {
    const found = steps.find((s) => s.agentKey === agentKey);
    if (found) {
      Object.assign(found, partial);
      // Normalise the step id so it never collides with an unrelated step that
      // happens to share the legacy admin label (artistic_base, prompt_architect, …).
      const desired = agentKey.toLowerCase();
      const collides = steps.some((s) => s !== found && s.id === desired);
      if (!collides) found.id = desired;
      console.log(`[roster] step ${agentKey} refreshed (order ${found.order}, id=${found.id})`);
      return;
    }
    const maxOrder = steps.reduce((m, s) => Math.max(m, s.order ?? 0), 0);
    // Use the agentKey itself (lowercased) as the step id so it never
    // collides with the legacy step labels (artistic_base, prompt_architect…)
    // that the admin assigned to *different* agents.
    let stepId = agentKey.toLowerCase();
    const existingIds = new Set(steps.map((s) => s.id));
    let suffix = 1;
    while (existingIds.has(stepId)) {
      suffix += 1;
      stepId = `${agentKey.toLowerCase()}-${suffix}`;
    }
    steps.push({
      id: stepId,
      agentKey,
      order: maxOrder + 10,
      enabled: true,
      required: false,
      executionMode: 'sequential',
      retries: 0,
      timeoutMs: 30000,
      condition: 'always',
      label: partial.label ?? agentKey,
      inputMemoryKeys: partial.inputMemoryKeys ?? [],
      outputMemoryKey: partial.outputMemoryKey ?? null,
    });
    console.log(`[roster] step ${agentKey} added at order ${maxOrder + 10}`);
  }

  // 1) ARTISTIC_BASE_AGENT — parallel design task, after planner, before architect.
  //    The canonical orchestrator code already invokes this agent by key.
  upsertStep('ARTISTIC_BASE_AGENT', {
    label: 'Base artistique',
    inputMemoryKeys: ['M-BRIEF-RAW', 'M-PLAN', 'M-CONCEPTS'],
    outputMemoryKey: 'M-ARTISTIC-RESOURCE',
    condition: 'planner_ready_or_force',
  });

  // 2) VISUAL_CRITIC_AGENT — post-quality, before LAYOUT_OVERLAY tweaks.
  upsertStep('VISUAL_CRITIC_AGENT', {
    label: 'Critique visuelle',
    inputMemoryKeys: ['M-PROMPT-FINAL', 'M-OVERLAY', 'M-BRAND'],
    outputMemoryKey: 'M-CRITIQUE',
    condition: 'has_prompt',
  });

  // 3) LEARNING_AGENT — last step, observes everything.
  upsertStep('LEARNING_AGENT', {
    label: 'Apprentissage',
    inputMemoryKeys: ['M-BRIEF-RAW', 'M-CONCEPTS', 'M-COPY', 'M-PROMPT-FINAL', 'M-OVERLAY', 'M-CRITIQUE'],
    outputMemoryKey: 'M-PROJECT-DNA',
    condition: 'always',
  });

  config.steps = steps.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  await prisma.appSetting.update({ where: { key: SETTING_KEY }, data: { value: JSON.stringify(config, null, 2) } });
  console.log(`[roster] pipeline saved (${steps.length} steps)`);
}

await ensureArtisticBaseAgent();
await fixVisualCriticKey();
await refreshVisualCriticPrompt();
await refreshLearningPrompt();
await updatePipeline();

await prisma.$disconnect();
