// Ensure COPYWRITER, IDEATION, TEXT_ANALYST receive M-BRIEF-RAW so they can
// extract the literal services / texts the user provided.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SETTING_KEY = 'orchestrator_pipeline_config';
const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY }, select: { value: true } });
const config = JSON.parse(row.value);
const steps = config.steps;

for (const agentKey of ['IDEATION_AGENT', 'TEXT_ANALYST_AGENT', 'COPYWRITER_AGENT']) {
  const step = steps.find((s) => s.agentKey === agentKey);
  if (!step) {
    console.warn(`[brief-inputs] ${agentKey} step missing`);
    continue;
  }
  const set = new Set(step.inputMemoryKeys ?? []);
  set.add('M-BRIEF-RAW');
  step.inputMemoryKeys = Array.from(set);
  console.log(`[brief-inputs] ${agentKey} inputs: ${step.inputMemoryKeys.join(', ')}`);
}

await prisma.appSetting.update({ where: { key: SETTING_KEY }, data: { value: JSON.stringify(config, null, 2) } });
console.log('[brief-inputs] pipeline saved');

await prisma.$disconnect();
