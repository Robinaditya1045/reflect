// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // allow global prisma to be reused across hot reloads in development
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'], // Enable logging for better debugging
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
