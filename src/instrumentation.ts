import * as Sentry from "@sentry/nextjs";
import { assertRuntimeEnv } from "@/lib/env";

export async function register() {
  // Validate configuration once, at boot, so a misconfigured deployment fails
  // immediately and by name rather than inside an unrelated request. Skipped
  // during `next build`, which runs as production without runtime secrets.
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    assertRuntimeEnv();
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
