/**
 * Crée (ou met à jour le mot de passe d') le premier compte `super_admin`.
 * À exécuter manuellement une fois par environnement (`npm run prisma:seed`)
 * — jamais via un endpoint HTTP public, voir
 * darmeuble-kit/docs/backend/socle-backend.md. Lit `SEED_SUPER_ADMIN_EMAIL`
 * / `SEED_SUPER_ADMIN_PASSWORD` (voir .env.example) plutôt qu'une valeur en
 * dur — jamais de secret dans le code.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient, Role } from '../src/generated/prisma/client';

const BCRYPT_SALT_ROUNDS = 12;

async function main(): Promise<void> {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'SEED_SUPER_ADMIN_EMAIL et SEED_SUPER_ADMIN_PASSWORD sont requis (voir .env.example)',
    );
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const existing = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, role: Role.super_admin, isActive: true },
    });
    console.log(`Super admin mis à jour : ${email}`);
  } else {
    await prisma.user.create({
      data: {
        organizationId: null,
        fullName: 'Super Administrateur DarMeuble',
        email,
        passwordHash,
        role: Role.super_admin,
      },
    });
    console.log(`Super admin créé : ${email}`);
  }

  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
