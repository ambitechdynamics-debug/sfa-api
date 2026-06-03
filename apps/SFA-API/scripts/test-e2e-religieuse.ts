/**
 * E2E test : création d'une affiche religieuse complète.
 *
 * Étapes simulées :
 *   1. Récupère l'utilisateur ADMIN.
 *   2. Crée un Project + Travail (poster religieux, format 3:4 A4).
 *   3. Sème un message initial dans le travail (brief utilisateur).
 *   4. Lance l'orchestrateur complet → produit M-PROMPT-FINAL.
 *   5. Lance la génération d'images (2 variations).
 *   6. Rapporte chaque étape (durée, sortie, succès/échec).
 */
import 'dotenv/config';
import { prisma } from '../src/config/database';
import { runFullOrchestration } from '../src/modules/orchestrator/promptOrchestrator.service';
import { imageGenService } from '../src/modules/image-generation/imageGen.service';

function fmtMs(ms: number) {
  return `${(ms / 1000).toFixed(2)}s`;
}

function section(title: string) {
  console.log('\n' + '═'.repeat(72));
  console.log(`  ${title}`);
  console.log('═'.repeat(72));
}

async function main() {
  const overallStart = Date.now();
  section('1. ADMIN USER');
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, credits: true },
  });
  if (!admin) {
    console.error('No ADMIN user — abort.');
    process.exit(1);
  }
  console.log('admin:', admin);

  section('2. CREATE PROJECT + TRAVAIL');
  const project = await prisma.project.create({
    data: {
      userId: admin.id,
      title: 'Paroisse Sainte-Marie',
      brandDescription: 'Paroisse catholique organisant des événements communautaires hebdomadaires.',
    },
  });
  console.log('project.id =', project.id);

  const travail = await prisma.travail.create({
    data: {
      userId: admin.id,
      projectId: project.id,
      title: 'Affiche messe de la Pentecôte',
      posterType: 'flyer-religieux',
      category: 'religieux',
      format: '3:4',
      style: 'liturgique-moderne',
      status: 'DRAFT',
    },
  });
  console.log('travail.id =', travail.id);

  section('3. SEED INITIAL BRIEF MESSAGE');
  const brief = [
    'Je suis le secrétariat de la paroisse Sainte-Marie. Nous voulons une affiche pour la messe de la Pentecôte.',
    '',
    'Informations à faire figurer :',
    '- Titre : « MESSE DE LA PENTECÔTE »',
    '- Sous-titre : « Venez recevoir l\'Esprit Saint »',
    '- Date : Dimanche 8 juin 2026',
    '- Horaires : 10h30 (messe solennelle) et 18h00 (vêpres)',
    '- Lieu : Église Sainte-Marie, 12 rue de l\'Église, 75000 Paris',
    '- Contact : 01 23 45 67 89 — paroisse@sainte-marie.fr',
    '',
    'Ambiance souhaitée : recueillement, douceur, lumière dorée, colombe symbolique, flammes de l\'Esprit Saint en arrière-plan, palette ivoire + or + bleu nuit.',
    'Style : moderne mais respectueux de la tradition liturgique. Pas d\'images choquantes.',
  ].join('\n');

  await prisma.message.create({
    data: {
      travailId: travail.id,
      role: 'USER',
      content: brief,
    },
  });
  console.log('seeded user brief (', brief.length, 'chars)');

  // Persist the brief under M-BRIEF-RAW (input of the orchestrator).
  const briefDef = await prisma.memoryDefinition.findUnique({ where: { key: 'M-BRIEF-RAW' } });
  if (briefDef) {
    await prisma.memoryEntry.upsert({
      where: {
        travailId_memoryDefinitionId: { travailId: travail.id, memoryDefinitionId: briefDef.id },
      },
      update: { content: { request: brief, savedAt: new Date().toISOString() } },
      create: {
        travailId: travail.id,
        userId: admin.id,
        memoryDefinitionId: briefDef.id,
        content: { request: brief, savedAt: new Date().toISOString() },
      },
    });
    console.log('seeded M-BRIEF-RAW entry');
  } else {
    console.warn('M-BRIEF-RAW memory definition not found in DB');
  }

  section('4. RUN ORCHESTRATOR (7+ agents → M-PROMPT-FINAL)');
  const orchestStart = Date.now();
  let orchestRes;
  try {
    orchestRes = await runFullOrchestration({
      travailId: travail.id,
      userId: admin.id,
      userRole: 'ADMIN',
      force: true,
    });
    console.log('orchestrator done in', fmtMs(Date.now() - orchestStart));
    console.log('agents executed:', orchestRes.data.agents_executed);
    console.log('agents skipped:', orchestRes.data.agents_skipped);
    console.log('agent failures:', orchestRes.data.agent_failures);
    console.log('ready_for_generation:', orchestRes.data.ready_for_generation);
    console.log('quality:', orchestRes.data.quality);
    console.log('safety:', orchestRes.data.safety);
    console.log('final_prompt (first 400 chars):', orchestRes.data.final_prompt?.slice(0, 400));
    console.log('negative_prompt:', orchestRes.data.negative_prompt?.slice(0, 200));
  } catch (e) {
    console.error('ORCHESTRATOR ERROR:', e instanceof Error ? e.message : e);
    console.error('full error:', e);
    process.exit(2);
  }

  section('5. INSPECT MEMORY ENTRIES');
  const memEntries = await prisma.memoryEntry.findMany({
    where: { travailId: travail.id },
    include: { memoryDefinition: { select: { key: true } } },
    orderBy: { createdAt: 'asc' },
  });
  for (const e of memEntries) {
    const sample = JSON.stringify(e.content).slice(0, 160);
    console.log(`  • ${e.memoryDefinition.key}  →  ${sample}${sample.length >= 160 ? '…' : ''}`);
  }

  section('6. INSPECT AGENT RUNS');
  const runs = await prisma.agentRun.findMany({
    where: { travailId: travail.id },
    orderBy: { createdAt: 'asc' },
    select: { agentName: true, provider: true, model: true, status: true, durationMs: true, error: true },
  });
  for (const r of runs) {
    console.log(
      `  • ${r.agentName.padEnd(25)} ${r.provider}/${r.model}  ${r.status}  ${fmtMs(r.durationMs ?? 0)}${r.error ? '  ERR=' + r.error.slice(0, 80) : ''}`,
    );
  }

  if (!orchestRes.data.ready_for_generation) {
    console.log('\nNot ready for generation — orchestrator stopped early. Skipping image gen.');
    process.exit(3);
  }

  section('7. GENERATE IMAGES (2 variations)');
  const genStart = Date.now();
  try {
    const result = await imageGenService.generate({
      travailId: travail.id,
      userId: admin.id,
      userRole: 'ADMIN',
      variations: 2,
    });
    console.log('image gen done in', fmtMs(result.durationMs));
    console.log('posters:');
    for (const p of result.posters) {
      console.log(`  • v${p.variationNumber}  ${p.imageUrl}  status=${p.status}`);
    }
  } catch (e) {
    console.error('IMAGE GEN ERROR:', e instanceof Error ? e.message : e);
    process.exit(4);
  }

  section('FINAL TRAVAIL STATE');
  const final = await prisma.travail.findUnique({
    where: { id: travail.id },
    include: { generatedPosters: true },
  });
  console.log('status:', final?.status);
  console.log('posters count:', final?.generatedPosters.length);
  for (const p of final?.generatedPosters ?? []) {
    console.log(`  - ${p.imageUrl}`);
  }

  console.log('\n✅ ALL DONE in', fmtMs(Date.now() - overallStart));
}

main()
  .catch((e) => {
    console.error('FATAL:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
