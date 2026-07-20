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

export interface MemberRole {
  id: string;
  name: string;
}



// Você também pode centralizar os tipos das Actions aqui
export interface ActionResponse {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}


export interface MemberSearchResult {
  id: string;
  name: string;
  role: { name: string } | null;
}