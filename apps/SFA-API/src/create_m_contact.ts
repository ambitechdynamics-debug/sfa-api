import { PrismaClient, MemoryScope } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

async function main() {
  const existing = await prisma.memoryDefinition.findUnique({ where: { key: 'M-CONTACT' } });
  if (existing) {
    console.log(`M-CONTACT existe déjà (id=${existing.id})`);
    return;
  }

  const created = await prisma.memoryDefinition.create({
    data: {
      key: 'M-CONTACT',
      name: 'Contact Client',
      description:
        'Informations de contact du projet : marque, téléphone, adresse, réseaux sociaux. Écrit par le dashboard client lors de la création de projet (dashboard/create/page.tsx).',
      scope: MemoryScope.PROJECT,
      schema: {
        type: 'object',
        properties: {
          brand: { type: 'string' },
          contact: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          address: { type: 'string' },
          social: {
            type: 'object',
            properties: {
              facebook: { type: 'string' },
              instagram: { type: 'string' },
              whatsapp: { type: 'string' },
              website: { type: 'string' },
            },
          },
        },
      },
      isSystem: false,
      isActive: true,
    },
  });
  console.log(`✓ M-CONTACT créé (id=${created.id})`);
}

main()
  .catch((e) => { console.error('ERREUR :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
