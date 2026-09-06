-- CreateTable
CREATE TABLE "journey_stage" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journey_stage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "journey_stage_key_key" ON "journey_stage"("key");

-- CreateIndex
CREATE UNIQUE INDEX "journey_stage_position_key" ON "journey_stage"("position");

-- CreateIndex
CREATE INDEX "journey_stage_position_idx" ON "journey_stage"("position");

-- RLS on, with no policy: the anon and authenticated Supabase keys can read
-- nothing. Prisma connects as a role that bypasses RLS, so application queries
-- are unaffected. Policies are added deliberately by the auth roadmap item;
-- until then the safe default is deny-all rather than an open table.
ALTER TABLE "journey_stage" ENABLE ROW LEVEL SECURITY;
