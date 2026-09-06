import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 moved connection URLs out of schema.prisma into this file, and no
 * longer loads .env on its own — hence the dotenv import.
 *
 * The URL here is used by the CLI — migrate, db seed, studio — and is
 * deliberately DIRECT_URL, the direct/session-mode connection. Migrations
 * cannot run through a transaction pooler. The running application uses the
 * pooled DATABASE_URL instead; see src/lib/prisma.ts.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
