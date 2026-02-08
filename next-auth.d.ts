import { DefaultSession } from "next-auth";

// 1. Atualizamos os tipos para incluir a nova Role
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "TREASURER" | "SECRETARY" | "OPERATOR";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      // 2. Tornamos opcionais porque o Super Admin pode ser global
      churchId?: string;
      churchSlug?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    churchId?: string;
    churchSlug?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    churchId?: string;
    churchSlug?: string;
  }
}