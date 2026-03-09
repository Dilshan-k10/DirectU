/*
  Warnings:

  - You are about to drop the column `document_path` on the `applications` table. All the data in the column will be lost.
  - You are about to alter the column `document_type` on the `applications` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.

*/
-- AlterTable
ALTER TABLE "applications" DROP COLUMN "document_path",
ADD COLUMN     "document_data" BYTEA,
ADD COLUMN     "document_name" VARCHAR(255),
ALTER COLUMN "document_type" SET DATA TYPE VARCHAR(100);
