import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Customer journey stages, from PRD.md.
 *
 * The PRD numbers six stages, but its sixth line — "Closed Won / On Hold /
 * Closed Lost" — names three distinct outcomes. They are seeded as separate
 * rows: On Hold is not a closed state, and the at-risk surfacing in the
 * dashboard roadmap item has to tell them apart.
 */
const stages = [
  { key: "new_inquiry", label: "New Inquiry", position: 1 },
  { key: "consultation", label: "Consultation", position: 2 },
  { key: "booking_confirmed", label: "Booking confirmed", position: 3 },
  { key: "self_trial_in_progress", label: "Self-trial in progress", position: 4 },
  { key: "post_trial_follow_up", label: "Post-trial follow up", position: 5 },
  { key: "closed_won", label: "Closed Won", position: 6 },
  { key: "on_hold", label: "On Hold", position: 7 },
  { key: "closed_lost", label: "Closed Lost", position: 8 },
] as const;

// The seed is a CLI-side script, so it uses the direct connection like migrate does.
const connectionString = process.env.DIRECT_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL is required to seed the database.");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  for (const stage of stages) {
    // Upsert on the stable key so re-running never duplicates, and never
    // clobbers a label an operator may have edited beyond its position.
    await prisma.journeyStage.upsert({
      where: { key: stage.key },
      create: stage,
      update: { position: stage.position },
    });
  }

  const count = await prisma.journeyStage.count();
  console.log(`Seeded journey stages. Total rows: ${count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
