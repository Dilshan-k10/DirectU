-- AlterTable
ALTER TABLE "exam_question_assignments" ADD COLUMN "student_id" TEXT;

-- Backfill student_id for existing rows using related application.candidate_id
UPDATE "exam_question_assignments" eqa
SET "student_id" = a."candidate_id"
FROM "test_results" tr
JOIN "applications" a ON tr."application_id" = a."id"
WHERE eqa."test_result_id" = tr."id"
  AND eqa."student_id" IS NULL;

-- CreateIndex
CREATE INDEX "idx_exam_q_assign_student" ON "exam_question_assignments"("student_id");
