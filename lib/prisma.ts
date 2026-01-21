import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"], // Logs essenciais para monitoria
  });

// CORREÇÃO: Usamos NODE_ENV para detetar o ambiente
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}