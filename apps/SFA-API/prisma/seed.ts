import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

const main = async () => {
  const fullName = process.env.ADMIN_FULL_NAME;
  const email = process.env.ADMIN_EMAIL;
  const phone = process.env.ADMIN_PHONE || undefined;
  const password = process.env.ADMIN_PASSWORD;

  if (!fullName || !email) {
    console.log('Admin seed skipped: ADMIN_FULL_NAME and ADMIN_EMAIL are required.');
    return;
  }

  const passwordHash = password ? await bcrypt.hash(password, BCRYPT_ROUNDS) : null;

  await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      phone,
      role: Role.ADMIN,
      ...(passwordHash ? { password: passwordHash } : {}),
    },
    create: {
      fullName,
      email,
      phone,
      role: Role.ADMIN,
      password: passwordHash,
    }
  });

  console.log(
    `Admin account ready: ${email}${passwordHash ? ' (password updated)' : ' (no ADMIN_PASSWORD set — keeping existing hash)'}`,
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
