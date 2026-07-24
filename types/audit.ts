import { Prisma } from "@/app/generated/prisma/client";

export interface AuditLog {
  id: string;
  churchId: string | null;  // 👈 reflecte o schema — String?
  userId?: string | null;
  userEmail: string | null;
  action: string;
  entityName: string;
  entityId: string;
  oldData: Prisma.JsonValue;
  newData: Prisma.JsonValue;
  ipAddress?: string | null;
  createdAt: Date | string;
}
