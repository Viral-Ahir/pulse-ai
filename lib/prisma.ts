import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

import { PrismaClient } from "@/app/generated/prisma/client";

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  if (databaseUrl.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: databaseUrl }).$extends(
      withAccelerate(),
    ) as unknown as PrismaClient;
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function isFreshClient(client: PrismaClient | undefined): client is PrismaClient {
  if (!client) return false;
  // Detect a stale dev-mode singleton (instantiated before a schema migration
  // added a new model). When `projectSpec` / `taskRun` are missing, we have
  // to recreate so the new delegates are wired up.
  const c = client as unknown as Record<string, unknown>;
  return c.projectSpec !== undefined && c.taskRun !== undefined;
}

export const prisma: PrismaClient = isFreshClient(globalForPrisma.prisma)
  ? globalForPrisma.prisma
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
