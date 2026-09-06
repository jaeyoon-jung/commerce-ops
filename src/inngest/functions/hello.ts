import { eventType } from "inngest";
import { z } from "zod";
import { inngest } from "@/lib/inngest";

/**
 * Proves the background-job layer is wired end to end.
 *
 * Two conventions every later job should copy:
 *
 * 1. The event carries a Zod schema. Inngest v4 accepts any Standard Schema,
 *    which Zod implements, so payloads are validated at the boundary rather
 *    than trusted — the same discipline tech-stack.md requires of webhook
 *    parsers and AI structured output.
 * 2. The work is a plain exported function. `createFunction` stays a thin
 *    registration wrapper, so the logic is unit-testable without the Inngest
 *    runtime, a dev server, or a live event.
 */
export const helloEvent = eventType("scaffold/hello", {
  schema: z.object({ name: z.string().min(1) }),
});

export function buildGreeting(name: string): string {
  return `Hello ${name}, from commerce-ops.`;
}

export const helloFunction = inngest.createFunction(
  { id: "scaffold-hello", triggers: [helloEvent] },
  async ({ event }) => ({ message: buildGreeting(event.data.name) }),
);
