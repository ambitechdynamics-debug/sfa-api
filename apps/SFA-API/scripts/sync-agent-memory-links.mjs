// Rewrites AgentMemoryLink to mirror the orchestrator pipeline so the page
// /admin/agent-memory-links shows what actually drives the runtime (the
// pipeline). Idempotent. After the saveAgentOutputs no-op refactor these
// links are informational only — but they should still match reality.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pipelineSetting = await prisma.appSetting.findUnique({
  where: { key: 'orchestrator_pipeline_config' },
  select: { value: true },
});
if (!pipelineSetting?.value) {
  console.error('[sync] pipeline config missing');
  process.exit(1);
}
const pipeline = JSON.parse(pipelineSetting.value);
const steps = Array.isArray(pipeline.steps) ? pipeline.steps : [];

const allMemoryKeys = new Set();
for (const s of steps) {
  for (const k of s.inputMemoryKeys ?? []) allMemoryKeys.add(k);
  if (s.outputMemoryKey) allMemoryKeys.add(s.outputMemoryKey);
}
const memories = await prisma.memoryDefinition.findMany({
  where: { key: { in: Array.from(allMemoryKeys) } },
  select: { id: true, key: true },
});
const memoryByKey = new Map(memories.map((m) => [m.key, m.id]));

const agents = await prisma.agentDefinition.findMany({ select: { id: true, key: true } });
const agentByKey = new Map(agents.map((a) => [a.key, a.id]));

let inserted = 0;
let removed = 0;

for (const step of steps) {
  const agentId = agentByKey.get(step.agentKey);
  if (!agentId) {
    console.warn(`[sync] agent ${step.agentKey} not in DB — skipping step ${step.id}`);
    continue;
  }

  const inputKeys = (step.inputMemoryKeys ?? []).filter((k) => memoryByKey.has(k));
  const outputKey = step.outputMemoryKey && memoryByKey.has(step.outputMemoryKey) ? step.outputMemoryKey : null;

  // Desired link set: INPUT for each input, OUTPUT for the output. If the
  // same key appears in both, store as BOTH.
  const desired = new Map(); // memoryId -> usageType
  for (const k of inputKeys) desired.set(memoryByKey.get(k), 'INPUT');
  if (outputKey) {
    const mid = memoryByKey.get(outputKey);
    desired.set(mid, desired.has(mid) ? 'BOTH' : 'OUTPUT');
  }

  const existing = await prisma.agentMemoryLink.findMany({
    where: { agentDefinitionId: agentId },
    select: { id: true, memoryDefinitionId: true, usageType: true },
  });
  const existingByMid = new Map(existing.map((l) => [l.memoryDefinitionId, l]));

  // Remove links no longer desired.
  for (const link of existing) {
    if (!desired.has(link.memoryDefinitionId)) {
      await prisma.agentMemoryLink.delete({ where: { id: link.id } });
      removed++;
    }
  }

  // Upsert desired links.
  let priority = 0;
  for (const [memoryId, usageType] of desired.entries()) {
    const existingLink = existingByMid.get(memoryId);
    if (existingLink) {
      if (existingLink.usageType !== usageType) {
        await prisma.agentMemoryLink.update({
          where: { id: existingLink.id },
          data: { usageType, priority },
        });
      }
    } else {
      await prisma.agentMemoryLink.create({
        data: {
          agentDefinitionId: agentId,
          memoryDefinitionId: memoryId,
          usageType,
          isRequired: false,
          priority,
        },
      });
      inserted++;
    }
    priority++;
  }
  console.log(`[sync] ${step.agentKey} → ${desired.size} links`);
}

console.log(`[sync] done. inserted=${inserted} removed=${removed}`);
await prisma.$disconnect();
