import dotenv from 'dotenv';
import { forbiddenRulesService } from '../src/modules/forbidden-rules/forbiddenRules.service';
import { prisma } from '../src/config/database';

dotenv.config();

const main = async () => {
  console.log('Seeding default forbidden rules...');
  const seedResult = await forbiddenRulesService.seedDefaults();
  console.log(`  → created: ${seedResult.created}, skipped (already existing): ${seedResult.skipped}`);

  console.log('Syncing to global M-INTERDITS memory...');
  const syncResult = await forbiddenRulesService.syncToGlobalMemory();
  console.log(`  → ${syncResult.ruleCount} rules synced (definition ${syncResult.definitionId}, entry ${syncResult.entryId ?? 'none'})`);
};

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
