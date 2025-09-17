import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Use global instance in development to prevent connection issues during hot reload
const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  // Do not override datasources here; let Prisma use the datasource defined in prisma/schema.prisma
  // and the DATABASE_URL from the environment. This ensures PostgreSQL is used in all environments.
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
