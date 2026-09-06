import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Liveness plus database reachability.
 *
 * Deliberately unauthenticated and cheap: it is what the Playwright smoke
 * asserts against and what confirms a Vercel deploy is actually talking to
 * Supabase. It reports the journey-stage count so a deploy against an
 * unmigrated or unseeded database is visibly wrong rather than merely "up".
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const journeyStages = await prisma.journeyStage.count();

    return NextResponse.json({
      status: "ok",
      database: "reachable",
      journeyStages,
    });
  } catch (error) {
    // Report the detail, return none: the body is public, so it carries a
    // stable indicator and never a stack trace or connection string.
    console.error("Health check failed", error);

    return NextResponse.json({ status: "error", database: "unreachable" }, { status: 503 });
  }
}
