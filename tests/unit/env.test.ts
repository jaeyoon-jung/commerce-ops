import { describe, expect, it } from "vitest";
import { assertRuntimeEnv, parseEnv } from "@/lib/env";

const valid = {
  DATABASE_URL: "postgresql://user:pw@pooler.example.com:6543/postgres?pgbouncer=true",
  DIRECT_URL: "postgresql://user:pw@pooler.example.com:5432/postgres",
  NEXT_PUBLIC_SENTRY_DSN: "https://abc123@o1.ingest.sentry.io/2",
  NODE_ENV: "test",
};

describe("parseEnv", () => {
  it("accepts a valid configuration", () => {
    const env = parseEnv(valid);
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(env.NODE_ENV).toBe("test");
  });

  it.each(["DATABASE_URL", "DIRECT_URL", "NEXT_PUBLIC_SENTRY_DSN"] as const)(
    "rejects a missing %s",
    (key) => {
      const { [key]: _omitted, ...rest } = valid;
      expect(() => parseEnv(rest)).toThrow(new RegExp(key));
    },
  );

  it.each(["DATABASE_URL", "DIRECT_URL", "NEXT_PUBLIC_SENTRY_DSN"] as const)(
    "rejects a blank %s",
    (key) => {
      expect(() => parseEnv({ ...valid, [key]: "" })).toThrow(new RegExp(key));
    },
  );

  it("rejects a connection string that is not postgres", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: "mysql://user@host/db" })).toThrow(/postgres/);
  });

  it("keeps the pooled and direct URLs distinct", () => {
    // Collapsing them is the mistake that makes `prisma migrate` fail in CI only:
    // the app works through the transaction pooler, migrations do not.
    expect(() => parseEnv({ ...valid, DIRECT_URL: valid.DATABASE_URL })).toThrow(
      /DIRECT_URL must differ/,
    );
  });

  it("defaults NODE_ENV to development when unset", () => {
    const { NODE_ENV: _omitted, ...rest } = valid;
    expect(parseEnv(rest).NODE_ENV).toBe("development");
  });
});

describe("assertRuntimeEnv", () => {
  const production = { ...valid, NODE_ENV: "production" };

  it("requires the Inngest keys in production", () => {
    expect(() => assertRuntimeEnv(production)).toThrow(/INNGEST_EVENT_KEY/);
    expect(() => assertRuntimeEnv(production)).toThrow(/INNGEST_SIGNING_KEY/);
  });

  it("passes in production once they are set", () => {
    expect(() =>
      assertRuntimeEnv({ ...production, INNGEST_EVENT_KEY: "k", INNGEST_SIGNING_KEY: "s" }),
    ).not.toThrow();
  });

  it("does not require them outside production", () => {
    // Local development runs against the Inngest dev server, which needs neither.
    expect(() => assertRuntimeEnv(valid)).not.toThrow();
  });

  it("leaves parseEnv free of them, so builds without runtime secrets succeed", () => {
    // `next build` runs with NODE_ENV=production on a machine holding no
    // runtime secrets; folding these into the schema breaks every CI build.
    expect(() => parseEnv(production)).not.toThrow();
  });
});
