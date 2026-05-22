import { prisma } from './config/database';

const OFFICIAL = [
  'PLANNER_AGENT',
  'BRAND_AGENT',
  'TEXT_ANALYST_AGENT',
  'IMAGE_ANALYST_AGENT',
  'ARTISTIC_BASE_AGENT',
  'PROMPT_ARCHITECT_AGENT',
  'QUALITY_AGENT',
  'GENERATOR_AGENT',
  'EXPORT_AGENT',
  'QUESTIONNAIRE_AGENT',
  'MEMORY_AGENT',
  'PROJECT_CONTEXT_AGENT',
  'FORMAT_AGENT',
  'REVISION_AGENT',
  'VARIATION_AGENT',
  'SAFETY_AGENT',
  'FILE_MANAGER_AGENT',
  'CONVERSATION_AGENT',
];

function norm(s: string): string {
  return (s || '')
    .toUpperCase()
    .replace(/[\s\-_]+/g, '_')
    .replace(/[^A-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function main() {
  const agents = await prisma.agentDefinition.findMany({
    include: {
      memoryLinks: { select: { id: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Count AgentRun references per agentName (string column)
  const runGroups = await prisma.agentRun.groupBy({
    by: ['agentName'],
    _count: { agentName: true },
  });
  const runCountByName = new Map<string, number>();
  for (const g of runGroups) runCountByName.set(g.agentName, g._count.agentName);

  console.log('===== AGENTS EN BASE =====');
  console.log(`Total: ${agents.length}\n`);

  const enriched = agents.map(a => ({
    id: a.id,
    key: a.key,
    name: a.name,
    description: (a.description || '').slice(0, 80),
    provider: a.provider,
    model: a.model,
    isActive: a.isActive,
    systemPromptLen: a.systemPrompt?.length || 0,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    memoryLinks: a.memoryLinks.length,
    runsByKey: runCountByName.get(a.key) || 0,
    runsByName: runCountByName.get(a.name) || 0,
    normKey: norm(a.key),
    normName: norm(a.name),
  }));

  for (const a of enriched) {
    console.log(JSON.stringify(a));
  }

  // ===== Compare to official list
  console.log('\n===== COMPARAISON AVEC LA LISTE OFFICIELLE =====');
  const officialNorm = new Set(OFFICIAL.map(norm));
  const foundOfficial: Record<string, typeof enriched> = {};
  for (const a of enriched) {
    for (const off of OFFICIAL) {
      if (a.normKey === norm(off) || a.normName === norm(off)) {
        (foundOfficial[off] = foundOfficial[off] || []).push(a);
      }
    }
  }
  for (const off of OFFICIAL) {
    const matches = foundOfficial[off] || [];
    if (matches.length === 0) console.log(`MANQUANT : ${off}`);
    else if (matches.length === 1) console.log(`OK       : ${off}  ->  key="${matches[0].key}" name="${matches[0].name}"`);
    else {
      console.log(`DOUBLON  : ${off}  (${matches.length} occurrences)`);
      for (const m of matches) {
        console.log(`           - id=${m.id} key="${m.key}" name="${m.name}" active=${m.isActive} createdAt=${m.createdAt.toISOString()} updatedAt=${m.updatedAt.toISOString()} promptLen=${m.systemPromptLen} memLinks=${m.memoryLinks} runsByKey=${m.runsByKey} runsByName=${m.runsByName}`);
      }
    }
  }

  // ===== Agents hors liste officielle
  console.log('\n===== AGENTS HORS LISTE OFFICIELLE =====');
  const officialNorms = OFFICIAL.map(norm);
  for (const a of enriched) {
    const matched = officialNorms.some(o => o === a.normKey || o === a.normName);
    if (!matched) {
      console.log(`HORS-LISTE : id=${a.id} key="${a.key}" name="${a.name}" runsByKey=${a.runsByKey} runsByName=${a.runsByName} memLinks=${a.memoryLinks}`);
    }
  }

  // ===== Group all agents by normalised key/name to spot duplicates among themselves
  console.log('\n===== GROUPES DE DOUBLONS (par nom normalisé) =====');
  const groups = new Map<string, typeof enriched>();
  for (const a of enriched) {
    const k = a.normKey || a.normName;
    if (!groups.has(k)) groups.set(k, [] as any);
    groups.get(k)!.push(a);
  }
  let dupCount = 0;
  for (const [k, list] of groups) {
    if (list.length > 1) {
      dupCount++;
      console.log(`-- Groupe "${k}" (${list.length} agents)`);
      for (const m of list) {
        console.log(`     id=${m.id} key="${m.key}" name="${m.name}" active=${m.isActive} createdAt=${m.createdAt.toISOString()} promptLen=${m.systemPromptLen} memLinks=${m.memoryLinks} runsByKey=${m.runsByKey} runsByName=${m.runsByName}`);
      }
    }
  }
  if (dupCount === 0) console.log('Aucun doublon par nom normalisé.');

  // ===== Distinct agentName values in AgentRun (to know orphan run names)
  console.log('\n===== TOUS LES agentName UTILISÉS DANS AgentRun =====');
  for (const g of runGroups.sort((a, b) => b._count.agentName - a._count.agentName)) {
    console.log(`  ${g.agentName}  -> ${g._count.agentName} runs`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
