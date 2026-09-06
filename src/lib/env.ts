import { z } from "zod";

/**
 * The single place `process.env` is read.
 *
 * `parseEnv` is pure so it can be tested directly. `env` resolves lazily on
 * first property access, and `assertEnv` is called from `instrumentation.ts`
 * so a misconfigured deployment fails at boot with the offending variable
 * named, rather than as an opaque failure deep inside a request.
 */

const postgresUrl = z
  .string()
  .min(1)
  .refine((value) => /^postgres(ql)?:\/\//.test(value), {
    message: "must be a postgres:// or postgresql:// connection string",
  });

export const envSchema = z
  .object({
    /** Pooled connection used by the running app; serverless opens many short-lived connections. */
    DATABASE_URL: postgresUrl,
    /**
     * Direct/session-mode connection, used only by `prisma migrate`.
     * Prisma cannot run migrations through a transaction pooler.
     */
    DIRECT_URL: postgresUrl,

    INNGEST_EVENT_KEY: z.string().min(1).optional(),
    INNGEST_SIGNING_KEY: z.string().min(1).optional(),

    /** Present only when source maps should upload; a build without it still succeeds. */
    SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
    SENTRY_ORG: z.string().min(1).optional(),
    SENTRY_PROJECT: z.string().min(1).optional(),

    NEXT_PUBLIC_SENTRY_DSN: z.string().min(1),

    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === "production") {
      // Without these, /api/inngest answers 500 at request time rather than
      // failing at boot — the exact opaque failure this module exists to avoid.
      for (const key of ["INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY"] as const) {
        if (!value[key]) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: `${key} is required in production; Inngest runs in cloud mode there.`,
          });
        }
      }
    }

    if (value.DATABASE_URL === value.DIRECT_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["DIRECT_URL"],
        message:
          "DIRECT_URL must differ from DATABASE_URL: migrations need a direct/session " +
          "connection, not the transaction pooler the app queries through.",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: NodeJS.ProcessEnv | Record<string, unknown>): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${detail}`);
  }

  return result.data;
}

let cached: Env | undefined;

/** Validate eagerly. Called from `instrumentation.ts` so failures surface at boot. */
export function assertEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

export const env = new Proxy({} as Env, {
  get: (_target, key: string) => assertEnv()[key as keyof Env],
}) satisfies Env;
