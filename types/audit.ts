import { Prisma } from "@prisma/client";

export interface AuditLog {
  id: string;
  churchId: string;
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
