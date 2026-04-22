CREATE UNIQUE INDEX "member_email_church_active_idx" 
ON "Member"("email", "churchId") 
WHERE "deletedAt" IS NULL AND email IS NOT NULL;