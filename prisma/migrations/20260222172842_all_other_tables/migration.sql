-- CreateEnum
CREATE TYPE "DegreeLevel" AS ENUM ('BACHELOR', 'MASTER', 'PHD');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('min_gpa', 'min_experience', 'required_subject', 'required_certification', 'custom');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('submitted', 'under_review', 'qualified', 'not_qualified', 'test_pending', 'test_completed', 'rejected', 'accepted');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('qualified', 'not_qualified', 'over_qualified', 'needs_improvement');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('in_progress', 'completed');

-- CreateEnum
CREATE TYPE "RankingStatus" AS ENUM ('accepted', 'rejected');

-- CreateTable
CREATE TABLE "Degree" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" "DegreeLevel" NOT NULL DEFAULT 'BACHELOR',
    "duration" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Degree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qualification_criteria" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "criteria_name" TEXT NOT NULL,
    "rule_type" "RuleType" NOT NULL,
    "conditions" JSONB NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qualification_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "intake_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "document_path" TEXT,
    "document_type" TEXT,
    "reconsideration_locked" BOOLEAN NOT NULL DEFAULT false,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intakes" (
    "id" TEXT NOT NULL,
    "intake_name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_analysis_results" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "extracted_data" JSONB NOT NULL,
    "qualification_match" BOOLEAN,
    "confidence_score" DECIMAL(5,2),
    "analysis_status" "AnalysisStatus" NOT NULL,
    "error_message" TEXT,
    "analyzed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cv_analysis_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_feedback" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "feedback_type" "FeedbackType" NOT NULL,
    "message" TEXT NOT NULL,
    "suggestions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alternative_programs" (
    "id" TEXT NOT NULL,
    "feedback_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "reason" TEXT,
    "match_score" DECIMAL(65,30),

    CONSTRAINT "alternative_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "improvement_steps" (
    "id" TEXT NOT NULL,
    "feedback_id" TEXT NOT NULL,
    "step_title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "Priority" NOT NULL,
    "estimated_duration" TEXT,

    CONSTRAINT "improvement_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_bank" (
    "id" TEXT NOT NULL,
    "degree_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "option_a" TEXT NOT NULL,
    "option_b" TEXT NOT NULL,
    "option_c" TEXT NOT NULL,
    "option_d" TEXT NOT NULL,
    "correct_answer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "status" "TestStatus" NOT NULL DEFAULT 'in_progress',
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "score" INTEGER,
    "obtained_marks" INTEGER,
    "percentage" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_answers" (
    "id" TEXT NOT NULL,
    "test_result_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_option" CHAR(1),
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "is_correct" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rankings" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "degree_id" TEXT NOT NULL,
    "intake_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "status" "RankingStatus",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rankings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cv_analysis_results_application_id_key" ON "cv_analysis_results"("application_id");

-- CreateIndex
CREATE INDEX "idx_question_bank_degree" ON "question_bank"("degree_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_results_application_id_key" ON "test_results"("application_id");

-- CreateIndex
CREATE INDEX "idx_test_results_application" ON "test_results"("application_id");

-- CreateIndex
CREATE INDEX "idx_candidate_answers_test" ON "candidate_answers"("test_result_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_answers_test_result_id_question_id_key" ON "candidate_answers"("test_result_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "rankings_application_id_key" ON "rankings"("application_id");

-- CreateIndex
CREATE INDEX "idx_rankings_degree_intake" ON "rankings"("degree_id", "intake_id");

-- CreateIndex
CREATE INDEX "idx_rankings_rank" ON "rankings"("rank");

-- AddForeignKey
ALTER TABLE "Degree" ADD CONSTRAINT "Degree_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qualification_criteria" ADD CONSTRAINT "qualification_criteria_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Degree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Degree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_intake_id_fkey" FOREIGN KEY ("intake_id") REFERENCES "intakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_analysis_results" ADD CONSTRAINT "cv_analysis_results_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_feedback" ADD CONSTRAINT "candidate_feedback_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alternative_programs" ADD CONSTRAINT "alternative_programs_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "candidate_feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alternative_programs" ADD CONSTRAINT "alternative_programs_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Degree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "improvement_steps" ADD CONSTRAINT "improvement_steps_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "candidate_feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bank" ADD CONSTRAINT "question_bank_degree_id_fkey" FOREIGN KEY ("degree_id") REFERENCES "Degree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_answers" ADD CONSTRAINT "candidate_answers_test_result_id_fkey" FOREIGN KEY ("test_result_id") REFERENCES "test_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_answers" ADD CONSTRAINT "candidate_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question_bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_degree_id_fkey" FOREIGN KEY ("degree_id") REFERENCES "Degree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_intake_id_fkey" FOREIGN KEY ("intake_id") REFERENCES "intakes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
