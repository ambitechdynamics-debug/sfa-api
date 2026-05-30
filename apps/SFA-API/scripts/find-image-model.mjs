// One-off discovery script: read the real Gemini API key from AppSetting and
// query Google's ListModels endpoint to surface which image-output models the
// caller actually has access to.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const row = await prisma.appSetting.findUnique({
  where: { key: 'custom_gemini-01_api_key' },
  select: { value: true },
});

if (!row?.value) {
  console.error('custom_gemini-01_api_key not found in DB');
  process.exit(1);
}

const apiKey = row.value.trim();
console.log(`Key fetched: starts with ${apiKey.slice(0, 8)}... length=${apiKey.length}`);

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=200`);
const json = await res.json();

if (json.error) {
  console.error('ListModels error:', JSON.stringify(json.error, null, 2));
  process.exit(1);
}

const models = json.models ?? [];
console.log(`Total models accessible: ${models.length}\n`);

console.log('--- Image-capable candidates ---');
const imageCandidates = models.filter((m) => {
  const name = (m.name ?? '').toLowerCase();
  return name.includes('image') || name.includes('imagen') || name.includes('flash-exp');
});
for (const m of imageCandidates) {
  console.log(`  ${m.name.replace('models/', '').padEnd(50)} methods=${(m.supportedGenerationMethods ?? []).join(',')}`);
}

console.log('\n--- All models supporting generateContent ---');
for (const m of models) {
  if ((m.supportedGenerationMethods ?? []).includes('generateContent')) {
    console.log(`  ${m.name.replace('models/', '')}`);
  }
}

await prisma.$disconnect();
