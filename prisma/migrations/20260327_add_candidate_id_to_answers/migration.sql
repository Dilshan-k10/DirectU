-- AddColumn to candidate_answers table
ALTER TABLE "candidate_answers" ADD COLUMN "candidate_id" TEXT;

-- Backfill candidate_id from test_results and applications
UPDATE "candidate_answers" ca
SET "candidate_id" = a."candidate_id"
FROM "test_results" tr
JOIN "applications" a ON tr."application_id" = a."id"
WHERE ca."test_result_id" = tr."id"
  AND ca."candidate_id" IS NULL;

-- Make candidate_id NOT NULL after backfill
ALTER TABLE "candidate_answers" ALTER COLUMN "candidate_id" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "candidate_answers" ADD CONSTRAINT "candidate_answers_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index on candidate_id
CREATE INDEX "idx_candidate_answers_candidate" ON "candidate_answers"("candidate_id");
