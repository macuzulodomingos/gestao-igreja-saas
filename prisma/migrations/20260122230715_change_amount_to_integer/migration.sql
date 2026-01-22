/*
  Warnings:

  - You are about to alter the column `amount` on the `FinanceTransaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "FinanceTransaction" ALTER COLUMN "amount" SET DATA TYPE INTEGER;
