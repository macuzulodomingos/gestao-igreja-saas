import { DefaultSession } from "next-auth";
import { UserRole } from "@/app/generated/prisma/enums";



declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      // 2. Tornamos opcionais porque o Super Admin pode ser global
      churchId?: string | null;
      churchSlug?: string | null;
      locale: string
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    churchId?: string | null;
    churchSlug?: string | null;
    locale?: string; 
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    churchId?: string | null;
    churchSlug?: string | null;
    locale?: string; // 👈 NOVO
    refreshedAt?: number;
  }
}