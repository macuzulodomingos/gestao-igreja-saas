// lib/auth.config.ts
import { UserRole } from "@/next-auth";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Este callback é o que o middleware usa para decidir o acesso
    authorized({ auth }) {
      return !!auth?.user;
    },
    // IMPORTANTE: Para o Middleware "enxergar" o role e o slug, 
    // precisamos passar eles pelo JWT aqui também, pois o middleware no Edge
    // não consegue acessar o banco de dados.
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