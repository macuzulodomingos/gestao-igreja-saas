/*
  Warnings:

  - You are about to drop the column `timezone` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" DROP COLUMN "timezone";

-- CreateIndex
CREATE INDEX "Member_churchId_deletedAt_idx" ON "Member"("churchId", "deletedAt");
