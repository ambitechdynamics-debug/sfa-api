import { PrismaClient } from '@prisma/client';
import { formatPosterTypeReferenceBlock } from './modules/agents/poster-format-map';

const prisma = new PrismaClient();

const REFERENCE_BLOCK = formatPosterTypeReferenceBlock();
const ANCHOR = '═══════════════════════════════════════════════════════════════';
const MARKER_TITLE = 'RÉFÉRENCE FORMAT × RÉSOLUTION par type de visuel';

const TARGETS = ['PLANNER_AGENT', 'PROMPT_ARCHITECT_AGENT', 'Generator-Agent'];

function injectAfterFirstLine(prompt: string): string {
  // Si la référence est déjà présente, on remplace le bloc existant (idempotent).
  if (prompt.includes(MARKER_TITLE)) {
    const start = prompt.indexOf(ANCHOR);
    const end = prompt.indexOf(ANCHOR, start + ANCHOR.length);
    const blockEnd = end !== -1 ? prompt.indexOf(ANCHOR, end + ANCHOR.length) : -1;
    if (blockEnd !== -1) {
      // Trois anchors trouvés — on remplace l'intégralité du bloc entre #1 et #3.
      const before = prompt.slice(0, start).trimEnd();
      const after = prompt.slice(blockEnd + ANCHOR.length).trimStart();
      return `${before}\n\n${REFERENCE_BLOCK}\n\n${after}`;
    }
  }
  // Sinon, on insère juste après la première ligne (le titre/rôle).
  const newlineIdx = prompt.indexOf('\n');
  if (newlineIdx === -1) return `${prompt}\n\n${REFERENCE_BLOCK}\n`;
  const head = prompt.slice(0, newlineIdx);
  const tail = prompt.slice(newlineIdx + 1).trimStart();
  return `${head}\n\n${REFERENCE_BLOCK}\n\n${tail}`;
}

async function main() {
  for (const key of TARGETS) {
    const row = await prisma.agentDefinition.findUnique({ where: { key } });
    if (!row) {
      console.warn(`[skip] ${key} not found in DB`);
      continue;
    }
    const updated = injectAfterFirstLine(row.systemPrompt);
    if (updated === row.systemPrompt) {
      console.log(`[noop] ${key} (already up to date)`);
      continue;
    }
    await prisma.agentDefinition.update({
      where: { key },
      data: { systemPrompt: updated },
    });
    console.log(`[updated] ${key}  (${row.systemPrompt.length} → ${updated.length} chars)`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
