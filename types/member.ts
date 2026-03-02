import { Prisma } from "@prisma/client";

export interface Member {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  // Alteração aqui: role agora é um objeto vindo do include: { role: true }
  role?: {
    id: string;
    name: string;
  } | null; 
  roleId: string | null; // O ID puro para o banco
  status: string;
  joinDate: string | Date; 
  churchId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuditLog {
  id: string;
  churchId: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityName: string;
  entityId: string;
  oldData: Prisma.JsonValue;
  newData: Prisma.JsonValue;
  ipAddress: string | null;
  createdAt: Date | string; // Use Date | string para evitar erros de serialização no Next.js
}

// Você também pode centralizar os tipos das Actions aqui
export interface ActionResponse {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}