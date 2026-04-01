import { UserRole } from "@/next-auth";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // 👈 sempre retorna true — o middleware trata o acesso
    authorized() {
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.churchSlug = user.churchSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as UserRole;
        session.user.churchSlug = token.churchSlug as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;