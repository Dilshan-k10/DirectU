-- Improved: Handle candidate_id properly with better backfill logic

-- First, delete any orphaned candidate_answers records that don't have corresponding test_results
DELETE FROM "candidate_answers" ca
WHERE NOT EXISTS (
  SELECT 1 FROM "test_results" tr 
  WHERE tr."id" = ca."test_result_id"
);

-- Backfill candidate_id from test_results and applications
-- This query is more robust and handles all cases
UPDATE "candidate_answers" ca
SET "candidate_id" = a."candidate_id"
FROM "test_results" tr
JOIN "applications" a ON tr."application_id" = a."id"
WHERE ca."test_result_id" = tr."id"
  AND ca."candidate_id" IS NULL;

-- Check for any remaining NULL values and log them (they shouldn't exist but just in case)
-- Delete any remaining records with NULL candidate_id
DELETE FROM "candidate_answers" 
WHERE "candidate_id" IS NULL;
