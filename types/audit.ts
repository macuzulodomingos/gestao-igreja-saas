import { Prisma } from "@prisma/client";

export interface AuditLog {
  id: string;
  action: string;
  entityName: string;
  entityId: string;
  userEmail: string | null;
  oldData: Prisma.JsonValue;
  newData: Prisma.JsonValue;
  createdAt: Date | string;
}
