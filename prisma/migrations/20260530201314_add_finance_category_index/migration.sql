-- DropIndex
DROP INDEX "FinanceTransaction_churchId_date_idx";

-- CreateIndex
CREATE INDEX "FinanceTransaction_churchId_date_categoryId_idx" ON "FinanceTransaction"("churchId", "date", "categoryId");
