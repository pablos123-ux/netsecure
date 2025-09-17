import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Use global instance in development to prevent connection issues during hot reload
const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  datasources: {
    db: {
      url: process.env.NODE_ENV === 'production' 
        ? process.env.DATABASE_URL 
        : "file:./prisma/dev.db",
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
