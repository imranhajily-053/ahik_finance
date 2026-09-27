import { PrismaClient } from "@prisma/client";

// Next.js dev mode hot-reloads modules; without this guard every reload would
// open a fresh Postgres connection pool. Standard singleton pattern.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
