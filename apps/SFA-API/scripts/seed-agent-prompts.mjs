// Seed updated system prompts + pipeline tweaks so the full Ambitech-style
// E2E works: PROMPT_ARCHITECT now produces a background-only prompt informed
// by the brief, and LAYOUT_OVERLAY_AGENT produces a strict overlay spec that
// imageOverlay.service.ts knows how to render. Also adds a LAYOUT_OVERLAY
// step to the orchestrator pipeline after QUALITY.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROMPT_ARCHITECT_SYSTEM_PROMPT = `Tu es PROMPT_ARCHITECT_AGENT. Tu construis un prompt en anglais à passer à un générateur d'image (Gemini Image / similar).

CONTRAINTES STRICTES :
- L'image générée doit être UNIQUEMENT un FOND visuel professionnel, sans aucun texte ni typographie incrustée. Le texte (titre, sous-titre, services, CTA) sera composé en post-production par une étape d'overlay côté backend. **Tu ne dois donc jamais demander au générateur de dessiner du texte.**
- Réserve un espace clair et propre pour l'overlay (en haut, au milieu ou en bas selon la composition la plus pertinente pour la marque).
- Respecte strictement la palette, le style et l'identité de marque fournis dans M-BRIEF-RAW, M-BRAND et M-STYLE.
- Si M-CONCEPTS contient des angles créatifs, choisis-en un et tiens-t'y.
- Tu reçois éventuellement un bloc « BASE ARTISTIQUE DISPONIBLE » avec des références — inspire-toi de leur composition, palette et ambiance.

FORMAT DE RÉPONSE (JSON strict, aucune autre clé) :
{
  "prompt": "Description complète en anglais de l'image à générer (fond uniquement, sans texte). Inclure : sujet visuel, composition, palette précise (hex), ambiance, espace réservé à l'overlay, ratio d'aspect.",
  "negativePrompt": "Éléments à exclure (texte, watermark, logo non fourni, mains déformées, etc.).",
  "referenceImageUrls": [],
  "ready_for_generation": true,
  "missing_information": []
}

RAPPEL : aucun texte/typographie/lettre dans le rendu — c'est l'overlay qui s'en chargera.`;

const LAYOUT_OVERLAY_SYSTEM_PROMPT = `Tu es LAYOUT_OVERLAY_AGENT. Tu produis la spécification d'OVERLAY TEXTE que le backend composera sur l'image générée via sharp + SVG.

ENTRÉES TYPIQUES : M-BRIEF-RAW (source du contenu client), M-COPY (textes nettoyés si dispo), M-TEXT-HIERARCHY (priorités), M-BRAND (palette + typographie).

Tu dois extraire les vrais textes du client (nom de marque, slogan/sous-titre, liste de services, CTA / téléphone / contact). N'INVENTE PAS de contenu — utilise strictement M-BRIEF-RAW / M-COPY.

FORMAT DE RÉPONSE (JSON strict, aucune clé en dehors de celle-ci) :
{
  "title":    { "text": "TITRE PRINCIPAL EN MAJUSCULES", "x": "50%", "y": "12%", "fontSize": 72, "color": "#FFFFFF", "fontWeight": "bold", "align": "center" },
  "subtitle": { "text": "Sous-titre / slogan",            "x": "50%", "y": "22%", "fontSize": 28, "color": "#FFA500", "align": "center" },
  "services": [
    { "text": "Service 1", "x": "50%", "y": "44%", "fontSize": 26, "color": "#FFFFFF", "align": "center" },
    { "text": "Service 2", "x": "50%", "y": "52%", "fontSize": 26, "color": "#FFFFFF", "align": "center" },
    { "text": "Service 3", "x": "50%", "y": "60%", "fontSize": 26, "color": "#FFFFFF", "align": "center" },
    { "text": "Service 4", "x": "50%", "y": "68%", "fontSize": 26, "color": "#FFFFFF", "align": "center" }
  ],
  "cta":      { "text": "Appelez-nous au +XXX XX XX XX XX", "x": "50%", "y": "88%", "fontSize": 30, "color": "#000080", "background": "#FFA500", "padding": 14, "align": "center", "fontWeight": "bold" }
}

RÈGLES :
- x / y peuvent être en pourcentages ("50%") OU en pixels (entier).
- align : "left" | "center" | "right".
- color / background : codes hex (#RRGGBB).
- Utilise la palette de M-BRAND pour les couleurs.
- Inclus TOUS les services mentionnés dans le brief, un par item de la liste services.
- Le CTA doit reprendre les coordonnées (téléphone, email) du brief.
- Place les éléments dans la zone libre que le PROMPT_ARCHITECT a réservée (généralement haut pour titre/sous-titre, milieu pour services, bas pour CTA).
- Ne renvoie RIEN d'autre que ce JSON.`;

async function patchAgent(key, systemPrompt) {
  const agent = await prisma.agentDefinition.findUnique({ where: { key }, select: { id: true } });
  if (!agent) {
    console.warn(`[seed] ${key} not found — skipping`);
    return;
  }
  await prisma.agentDefinition.update({ where: { id: agent.id }, data: { systemPrompt } });
  console.log(`[seed] ${key} systemPrompt updated (${systemPrompt.length} chars)`);
}

async function updatePipeline() {
  const SETTING_KEY = 'orchestrator_pipeline_config';
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY }, select: { value: true } });
  if (!row?.value) {
    console.warn('[seed] pipeline config not found in AppSetting — skipping');
    return;
  }
  const config = JSON.parse(row.value);
  const steps = Array.isArray(config.steps) ? config.steps : [];

  // 1) Ensure PROMPT_ARCHITECT step has M-BRIEF-RAW in its inputs.
  const architect = steps.find((s) => s.agentKey === 'PROMPT_ARCHITECT_AGENT');
  if (architect) {
    const inputs = new Set(architect.inputMemoryKeys ?? []);
    inputs.add('M-BRIEF-RAW');
    architect.inputMemoryKeys = Array.from(inputs);
    console.log(`[seed] architect inputs: ${architect.inputMemoryKeys.join(', ')}`);
  }

  // 2) Ensure a LAYOUT_OVERLAY step exists after quality. Idempotent.
  const overlayExists = steps.some((s) => s.agentKey === 'LAYOUT_OVERLAY_AGENT');
  if (!overlayExists) {
    const maxOrder = steps.reduce((m, s) => Math.max(m, s.order ?? 0), 0);
    steps.push({
      id: 'layout_overlay',
      label: 'Overlay texte',
      agentKey: 'LAYOUT_OVERLAY_AGENT',
      order: maxOrder + 10,
      enabled: true,
      required: false,
      executionMode: 'sequential',
      inputMemoryKeys: ['M-BRIEF-RAW', 'M-COPY', 'M-BRAND', 'M-TEXT-HIERARCHY', 'M-PROMPT-FINAL'],
      outputMemoryKey: 'M-OVERLAY',
      retries: 0,
      timeoutMs: 30000,
      condition: 'has_prompt',
    });
    console.log('[seed] added LAYOUT_OVERLAY step at order', maxOrder + 10);
  } else {
    const o = steps.find((s) => s.agentKey === 'LAYOUT_OVERLAY_AGENT');
    o.enabled = true;
    o.outputMemoryKey = 'M-OVERLAY';
    o.inputMemoryKeys = Array.from(new Set([...(o.inputMemoryKeys ?? []), 'M-BRIEF-RAW', 'M-COPY', 'M-BRAND', 'M-TEXT-HIERARCHY', 'M-PROMPT-FINAL']));
    console.log('[seed] LAYOUT_OVERLAY step refreshed');
  }

  config.steps = steps.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  await prisma.appSetting.update({ where: { key: SETTING_KEY }, data: { value: JSON.stringify(config, null, 2) } });
  console.log(`[seed] pipeline saved (${steps.length} steps)`);
}

async function ensureMOverlayDefinition() {
  const existing = await prisma.memoryDefinition.findUnique({ where: { key: 'M-OVERLAY' }, select: { id: true } });
  if (existing) {
    console.log('[seed] M-OVERLAY MemoryDefinition already exists');
    return;
  }
  await prisma.memoryDefinition.create({
    data: {
      key: 'M-OVERLAY',
      name: 'Overlay texte',
      description: "Spec d'overlay (titre/sous-titre/services/CTA + positions/couleurs) composée sur l'image générée par imageOverlay.service.ts.",
      scope: 'PROJECT',
      schema: {},
      isActive: true,
    },
  });
  console.log('[seed] M-OVERLAY MemoryDefinition created');
}

await patchAgent('PROMPT_ARCHITECT_AGENT', PROMPT_ARCHITECT_SYSTEM_PROMPT);
await patchAgent('LAYOUT_OVERLAY_AGENT', LAYOUT_OVERLAY_SYSTEM_PROMPT);
await ensureMOverlayDefinition();
await updatePipeline();

await prisma.$disconnect();
