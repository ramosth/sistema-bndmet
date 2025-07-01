import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma = globalThis.__prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// ✅ FORÇA UTC para todas as operações de data
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// ✅ Configura timezone globalmente para UTC
process.env.TZ = 'UTC';

export default prisma;