import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

async function main() {
  console.log('=== État de la migration add_creation_options ===\n');

  // 1. Table existe ?
  const tableRows = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'CreationOption'
  `;
  const tableExists = tableRows.length > 0;
  console.log(`Table "CreationOption" : ${tableExists ? '✓ existe' : '✗ absente'}`);

  // 2. Index existent ?
  const idxRows = await prisma.$queryRaw<Array<{ indexname: string }>>`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'CreationOption'
  `;
  const idxNames = idxRows.map((r) => r.indexname).sort();
  console.log(`Index trouvés : ${idxNames.length}`);
  idxNames.forEach((n) => console.log(`  - ${n}`));

  // 3. Compter les lignes si table existe
  if (tableExists) {
    const countRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM "CreationOption"
    `;
    console.log(`Lignes en DB : ${countRows[0].count}`);
  }

  // 4. État dans _prisma_migrations
  const migRows = await prisma.$queryRaw<Array<{
    migration_name: string;
    started_at: Date;
    finished_at: Date | null;
    applied_steps_count: number;
    rolled_back_at: Date | null;
  }>>`
    SELECT migration_name, started_at, finished_at, applied_steps_count, rolled_back_at
    FROM _prisma_migrations
    WHERE migration_name = '20260522000000_add_creation_options'
  `;
  if (migRows.length === 0) {
    console.log('\n_prisma_migrations : aucune entrée pour cette migration');
  } else {
    const m = migRows[0];
    console.log(`\n_prisma_migrations : migration_name=${m.migration_name}`);
    console.log(`  started_at=${m.started_at?.toISOString()}`);
    console.log(`  finished_at=${m.finished_at?.toISOString() ?? 'NULL ← échec partiel'}`);
    console.log(`  applied_steps_count=${m.applied_steps_count}`);
    console.log(`  rolled_back_at=${m.rolled_back_at?.toISOString() ?? 'NULL'}`);
  }

  // 5. Décision
  console.log('\n=== Recommandation ===');
  if (tableExists && idxNames.length >= 4) {
    console.log('La table + 4 index sont déjà en DB. Marquer la migration comme APPLIQUÉE :');
    console.log('  npx prisma migrate resolve --applied 20260522000000_add_creation_options');
  } else if (!tableExists && idxNames.length === 0) {
    console.log('Rien n\'a été créé. Marquer comme ROLLED BACK pour ré-essayer :');
    console.log('  npx prisma migrate resolve --rolled-back 20260522000000_add_creation_options');
  } else {
    console.log('État partiel détecté — il faut nettoyer manuellement avant de marquer rolled-back :');
    console.log('  DROP TABLE IF EXISTS "CreationOption";');
    console.log('  npx prisma migrate resolve --rolled-back 20260522000000_add_creation_options');
  }
}

main()
  .catch((e) => { console.error('ERREUR :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
