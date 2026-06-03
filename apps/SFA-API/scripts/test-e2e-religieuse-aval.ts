/**
 * E2E test aval : isole la partie image-gen (sans appeler Gemini text).
 *
 * Crédits Gemini épuisés → on bypasse l'orchestrateur en seedant directement
 * M-PROMPT-FINAL avec un prompt religieux, puis on appelle imageGenService.
 *
 * On force le provider 'mock' pour la génération image (pas de crédits Gemini),
 * ce qui valide quand même : storage Cloudinary, retry policy, persistance
 * GeneratedPoster, transitions de TravailStatus, overlay service.
 */
import 'dotenv/config';
import { prisma } from '../src/config/database';
import { imageGenService } from '../src/modules/image-generation/imageGen.service';

function fmtMs(ms: number) {
  return `${(ms / 1000).toFixed(2)}s`;
}
function section(t: string) {
  console.log('\n' + '═'.repeat(72));
  console.log(`  ${t}`);
  console.log('═'.repeat(72));
}

async function main() {
  const t0 = Date.now();

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, email: true },
  });
  if (!admin) throw new Error('No ADMIN user');
  section('1. ADMIN');
  console.log(admin);

  section('2. CREATE PROJECT + TRAVAIL (religieux 3:4)');
  const project = await prisma.project.create({
    data: {
      userId: admin.id,
      title: 'Paroisse Sainte-Marie [aval]',
      brandDescription: 'Paroisse catholique parisienne.',
    },
  });
  const travail = await prisma.travail.create({
    data: {
      userId: admin.id,
      projectId: project.id,
      title: 'Affiche messe de la Pentecôte [aval]',
      posterType: 'flyer-religieux',
      category: 'religieux',
      format: '3:4',
      style: 'liturgique-moderne',
      status: 'READY_FOR_PROMPT',
    },
  });
  console.log('project.id =', project.id, ' travail.id =', travail.id);

  section('3. SEED M-PROMPT-FINAL (prompt religieux complet, score 92)');
  const promptDef = await prisma.memoryDefinition.findUnique({
    where: { key: 'M-PROMPT-FINAL' },
  });
  if (!promptDef) throw new Error('Memory definition M-PROMPT-FINAL absente — pipeline mal seeded.');
  const finalPromptText = [
    'Affiche liturgique de la messe de Pentecôte, paroisse catholique Sainte-Marie.',
    'Composition verticale 3:4 (format A4 portrait).',
    'Au centre : une colombe blanche stylisée descendant dans un halo de lumière dorée, entourée de douze flammes ascendantes.',
    'En arrière-plan : un vitrail abstrait bleu nuit, croix discrète latérale, dégradé ivoire vers ambre en haut.',
    'Typographie : titre « MESSE DE LA PENTECÔTE » en sérif élégant or-cuivré ; sous-titre « Venez recevoir l\'Esprit Saint » en italique fin ivoire.',
    'Bloc info en bas : Dimanche 8 juin 2026 — 10h30 et 18h00 — Église Sainte-Marie, 12 rue de l\'Église, Paris — 01 23 45 67 89.',
    'Style : moderne respectueux de la tradition liturgique, atmosphère de recueillement et de joie spirituelle, haute lisibilité.',
    'Palette : ivoire (#F7F1E3), or doux (#D4A857), bleu nuit (#1A2B5C), accents ambrés.',
  ].join(' ');
  const negativePrompt =
    'pas de visages humains photoréalistes, pas de croix gammée ou symboles offensants, pas d\'images choquantes, pas de texte illisible';

  await prisma.memoryEntry.upsert({
    where: {
      travailId_memoryDefinitionId: { travailId: travail.id, memoryDefinitionId: promptDef.id },
    },
    update: {
      content: {
        finalPrompt: { prompt: finalPromptText, negativePrompt },
        quality_score: 92,
      },
    },
    create: {
      travailId: travail.id,
      userId: admin.id,
      memoryDefinitionId: promptDef.id,
      content: {
        finalPrompt: { prompt: finalPromptText, negativePrompt },
        quality_score: 92,
      },
    },
  });
  console.log('M-PROMPT-FINAL seeded (', finalPromptText.length, 'chars, score 92)');

  section('4. GENERATE IMAGES — provider=mock × 2 variations');
  const gStart = Date.now();
  const result = await imageGenService.generate({
    travailId: travail.id,
    userId: admin.id,
    userRole: 'ADMIN',
    variations: 2,
    provider: 'mock',
  });
  console.log('image gen done in', fmtMs(result.durationMs), '(real:', fmtMs(Date.now() - gStart), ')');
  for (const p of result.posters) {
    console.log(`  • v${p.variationNumber}  ${p.imageUrl}  status=${p.status}  id=${p.id}`);
  }

  section('5. FINAL TRAVAIL STATE');
  const final = await prisma.travail.findUnique({
    where: { id: travail.id },
    include: { generatedPosters: true },
  });
  console.log('travail.status =', final?.status);
  console.log('posters persisted =', final?.generatedPosters.length);

  section('6. DOWNLOAD URL (PDF 1200px, q=85)');
  const dl = await imageGenService.buildDownloadUrl({
    userId: admin.id,
    userRole: 'ADMIN',
    travailId: travail.id,
    posterId: result.posters[0].id,
    format: 'pdf',
    width: 1200,
    quality: 85,
  });
  console.log('filename:', dl.filename);
  console.log('url:', dl.url);

  console.log('\n✅ AVAL OK in', fmtMs(Date.now() - t0));
}

main()
  .catch((e) => {
    console.error('FATAL:', e instanceof Error ? e.message : e);
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
