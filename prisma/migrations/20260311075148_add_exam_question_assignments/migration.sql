-- CreateTable
CREATE TABLE "exam_question_assignments" (
    "id" TEXT NOT NULL,
    "test_result_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "order" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_question_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_exam_q_assign_test" ON "exam_question_assignments"("test_result_id");

-- CreateIndex
CREATE INDEX "idx_exam_q_assign_question" ON "exam_question_assignments"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_question_assignments_test_result_id_question_id_key" ON "exam_question_assignments"("test_result_id", "question_id");

-- AddForeignKey
ALTER TABLE "exam_question_assignments" ADD CONSTRAINT "exam_question_assignments_test_result_id_fkey" FOREIGN KEY ("test_result_id") REFERENCES "test_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_question_assignments" ADD CONSTRAINT "exam_question_assignments_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question_bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
