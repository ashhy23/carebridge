const { PrismaClient } = require('@prisma/client');

// Reuse one client in development so hot-reload does not exhaust DB connections
const globalForPrisma = global;

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
