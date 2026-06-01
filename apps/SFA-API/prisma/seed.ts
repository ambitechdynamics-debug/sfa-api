import { PrismaClient, Role } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const main = async () => {
  const fullName = process.env.ADMIN_FULL_NAME;
  const email = process.env.ADMIN_EMAIL;
  const phone = process.env.ADMIN_PHONE || undefined;

  if (!fullName || !email) {
    console.log('Admin seed skipped: ADMIN_FULL_NAME and ADMIN_EMAIL are required.');
    return;
  }

  await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      phone,
      role: Role.ADMIN
    },
    create: {
      fullName,
      email,
      phone,
      role: Role.ADMIN
    }
  });

  console.log(`Admin account ready: ${email}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
