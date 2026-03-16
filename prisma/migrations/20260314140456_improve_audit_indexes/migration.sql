-- CreateIndex
CREATE INDEX "AuditLog_churchId_entityName_action_idx" ON "AuditLog"("churchId", "entityName", "action");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
