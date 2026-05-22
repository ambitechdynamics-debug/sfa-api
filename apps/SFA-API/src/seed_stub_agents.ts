import { Prisma, PrismaClient } from '@prisma/client';
import { FILE_MANAGER_AGENT_SYSTEM_PROMPT } from './modules/agents/system-prompts/fileManager.prompt';
import { MEMORY_AGENT_SYSTEM_PROMPT } from './modules/agents/system-prompts/memoryAgent.prompt';
import { PROJECT_CONTEXT_AGENT_SYSTEM_PROMPT } from './modules/agents/system-prompts/projectContext.prompt';
import { REVISION_AGENT_SYSTEM_PROMPT } from './modules/agents/system-prompts/revisionAgent.prompt';
import { SAFETY_AGENT_SYSTEM_PROMPT } from './modules/agents/system-prompts/safetyAgent.prompt';
import { VARIATION_AGENT_SYSTEM_PROMPT } from './modules/agents/system-prompts/variationAgent.prompt';

const prisma = new PrismaClient({ log: ['error'] });

type StubSeed = {
  key: string;
  description: string;
  systemPrompt: string;
  expectedOutputSchema: Record<string, unknown>;
};

const STUBS: StubSeed[] = [
  {
    key: 'FILE_MANAGER_AGENT',
    description:
      'Catalogue et classifie les fichiers importés du client (logos, modèles, références) pour les rendre exploitables par les agents en aval.',
    systemPrompt: FILE_MANAGER_AGENT_SYSTEM_PROMPT,
    expectedOutputSchema: {
      type: 'object',
      required: ['classified_assets', 'duplicates', 'needs_review', 'missing_assets', 'ready_for_next_step'],
      properties: {
        classified_assets: { type: 'array', items: { type: 'object' } },
        duplicates: { type: 'array', items: { type: 'object' } },
        needs_review: { type: 'array', items: { type: 'string' } },
        missing_assets: { type: 'array', items: { type: 'string' } },
        ready_for_next_step: { type: 'boolean' },
      },
    },
  },
  {
    key: 'MEMORY_AGENT',
    description:
      'Consolide les mémoires hétérogènes du projet (M_SMS, M_QT2, M-CREATIVE-BRIEF, M-CONTACT…) en un état projet unifié et signale les conflits.',
    systemPrompt: MEMORY_AGENT_SYSTEM_PROMPT,
    expectedOutputSchema: {
      type: 'object',
      required: ['merged_state', 'conflicts', 'missing_memories', 'ready_for_next_step'],
      properties: {
        merged_state: { type: 'object' },
        conflicts: { type: 'array', items: { type: 'object' } },
        missing_memories: { type: 'array', items: { type: 'string' } },
        ready_for_next_step: { type: 'boolean' },
      },
    },
  },
  {
    key: 'PROJECT_CONTEXT_AGENT',
    description:
      'Enrichit le contexte projet (secteur, audience, ton, codes visuels, contraintes culturelles) à partir des mémoires et de l\'historique client.',
    systemPrompt: PROJECT_CONTEXT_AGENT_SYSTEM_PROMPT,
    expectedOutputSchema: {
      type: 'object',
      required: ['sector', 'recommended_tone', 'visual_codes', 'assumptions', 'ready_for_next_step'],
      properties: {
        sector: { type: 'string' },
        sub_sector: { type: 'string' },
        geographic_market: { type: 'string' },
        target_persona: { type: 'string' },
        recommended_tone: { type: 'string' },
        tone_justification: { type: 'string' },
        visual_codes: { type: 'array', items: { type: 'string' } },
        cultural_constraints: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'object' } },
        alternative_contexts: { type: 'array', items: { type: 'object' } },
        ready_for_next_step: { type: 'boolean' },
      },
    },
  },
  {
    key: 'REVISION_AGENT',
    description:
      'Interprète les demandes de retouche client après génération (M-RETOUCHE) et produit un patch ciblé du prompt M-PROMPT1 sans tout réécrire.',
    systemPrompt: REVISION_AGENT_SYSTEM_PROMPT,
    expectedOutputSchema: {
      type: 'object',
      required: ['patch_summary', 'prompt_changes', 'iteration_number', 'ready_for_next_step'],
      properties: {
        patch_summary: { type: 'string' },
        prompt_changes: { type: 'array', items: { type: 'object' } },
        updated_negative_prompt_additions: { type: 'array', items: { type: 'string' } },
        needs_clarification: { type: 'array', items: { type: 'string' } },
        impossible_requests: { type: 'array', items: { type: 'string' } },
        iteration_number: { type: 'integer', minimum: 1 },
        suggest_fresh_start: { type: 'boolean' },
        ready_for_next_step: { type: 'boolean' },
      },
    },
  },
  {
    key: 'SAFETY_AGENT',
    description:
      'Filtre le prompt M-PROMPT1 contre les règles interdites (ForbiddenRule + M-INTERDITS). Approuve, amende ou bloque le contenu avant génération.',
    systemPrompt: SAFETY_AGENT_SYSTEM_PROMPT,
    expectedOutputSchema: {
      type: 'object',
      required: ['decision', 'violations', 'ready_for_next_step'],
      properties: {
        decision: { type: 'string', enum: ['approved', 'amended', 'blocked'] },
        violations: { type: 'array', items: { type: 'object' } },
        amended_prompt: { type: ['string', 'null'] },
        amended_negative_prompt_additions: { type: 'array', items: { type: 'string' } },
        client_message: { type: ['string', 'null'] },
        ready_for_next_step: { type: 'boolean' },
      },
    },
  },
  {
    key: 'VARIATION_AGENT',
    description:
      'Produit 3 à 5 variantes ciblées du prompt validé (fidèle, créative, premium, minimaliste, social) en respectant l\'identité de marque.',
    systemPrompt: VARIATION_AGENT_SYSTEM_PROMPT,
    expectedOutputSchema: {
      type: 'object',
      required: ['variations', 'ready_for_next_step'],
      properties: {
        variations: { type: 'array', items: { type: 'object' }, minItems: 1, maxItems: 5 },
        skipped_variations: { type: 'array', items: { type: 'object' } },
        ready_for_next_step: { type: 'boolean' },
      },
    },
  },
];

async function main() {
  console.log('=== Seed des 6 prompts pour les stubs activés ===');
  console.log('(provider et model laissés intacts — choix utilisateur via /admin/agents)\n');

  for (const stub of STUBS) {
    const before = await prisma.agentDefinition.findUnique({
      where: { key: stub.key },
      select: { id: true, provider: true, model: true, systemPrompt: true },
    });

    if (!before) {
      console.log(`✗ ${stub.key} : introuvable en base — saut`);
      continue;
    }

    await prisma.agentDefinition.update({
      where: { id: before.id },
      data: {
        description: stub.description,
        systemPrompt: stub.systemPrompt,
        expectedOutputSchema: stub.expectedOutputSchema as Prisma.InputJsonValue,
        // isActive, provider, model : NON MODIFIÉS
      },
    });

    const oldLen = before.systemPrompt.length;
    const newLen = stub.systemPrompt.length;
    console.log(`✓ ${stub.key.padEnd(26)} prompt ${oldLen} → ${newLen} chars (provider="${before.provider}" model="${before.model}" inchangés)`);
  }

  console.log('\n=== Vérification finale ===');
  const todoLeft = await prisma.agentDefinition.count({
    where: { systemPrompt: { startsWith: 'TODO' } },
  });
  console.log(`Agents avec prompt TODO restants : ${todoLeft}`);

  const all = await prisma.agentDefinition.findMany({
    select: { key: true, isActive: true, systemPrompt: true, provider: true, model: true },
    orderBy: { key: 'asc' },
  });
  console.log(`\nÉtat final (${all.length} agents) :`);
  for (const a of all) {
    const promptOk = a.systemPrompt.length > 100 && !a.systemPrompt.startsWith('TODO');
    console.log(`  ${a.isActive ? '[ON]' : '[off]'} ${promptOk ? '[prompt OK]' : '[prompt KO]'} ${a.key.padEnd(26)} provider=${a.provider} model=${a.model}`);
  }
}

main()
  .catch(e => { console.error('ERREUR :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
