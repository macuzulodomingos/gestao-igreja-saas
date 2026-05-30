-- DropIndex
DROP INDEX "ImpersonationSession_expiresAt_idx";

-- DropIndex
DROP INDEX "ImpersonationSession_superAdminId_idx";

-- CreateIndex
CREATE INDEX "ImpersonationSession_superAdminId_churchId_endedAt_idx" ON "ImpersonationSession"("superAdminId", "churchId", "endedAt");

-- CreateIndex
CREATE INDEX "ImpersonationSession_superAdminId_endedAt_expiresAt_idx" ON "ImpersonationSession"("superAdminId", "endedAt", "expiresAt");
