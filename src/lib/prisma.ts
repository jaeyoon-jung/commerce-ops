import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

/**
 * Prisma 7 connects through a driver adapter rather than a URL in the schema.
 *
 * The application uses DATABASE_URL — the transaction pooler, which suits
 * serverless functions opening many short-lived connections. The Prisma CLI
 * uses DIRECT_URL instead, because migrations cannot run through a transaction
 * pooler; see prisma.config.ts.
 *
 * Cached on globalThis so hot reload in development does not open a new pool on
 * every edit and exhaust the database's connection limit.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
