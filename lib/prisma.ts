import { PrismaClient } from '@prisma/client';

// Use globalThis to avoid "Cannot find name 'global'" error in standard environment
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// DATABASE_URL configurada no Docker ou .env
// Ex MySQL: "mysql://user:pass@host:3306/db"
// Ex SQLite: "file:/app/data/dev.db"
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;