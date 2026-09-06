import { Inngest } from "inngest";

/**
 * The single Inngest client. Ingestion pipelines and scheduled task generation
 * — decision follow-ups, device recovery, payment reminders — register against
 * this client as later roadmap items land.
 */
export const inngest = new Inngest({ id: "commerce-ops" });
