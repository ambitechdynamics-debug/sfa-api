import bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const main = async () => {
  const fullName = process.env.ADMIN_FULL_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const phone = process.env.ADMIN_PHONE || undefined;

  if (!fullName || !email || !password) {
    console.log('Admin seed skipped: ADMIN_FULL_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required.');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      phone,
      password: hashedPassword,
      role: Role.ADMIN
    },
    create: {
      fullName,
      email,
      phone,
      password: hashedPassword,
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
