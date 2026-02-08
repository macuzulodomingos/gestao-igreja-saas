// lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { authConfig } from "./auth.config";
import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";


// Definimos o tipo local para os Roles (conforme o seu Schema Prisma)
type UserRole = "SUPER_ADMIN" | "ADMIN" | "TREASURER" | "SECRETARY" | "OPERATOR";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig, // Puxa as páginas e o callback authorized do config leve
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials;
        
        const user = await prisma.user.findUnique({
          where: { email: email as string },
          include: { church: { select: { slug: true } } }
        });

        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(password as string, user.password);
        
        if (passwordMatch) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            churchId: user.churchId,
            churchSlug: user.church?.slug || null,
          };
        } 

        return null;
      }, 
    }),
  ],
  callbacks: {
    // 1. O JWT recebe os dados do 'user' vindo do authorize e guarda no token
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.churchId = user.churchId;
        token.churchSlug = user.churchSlug;
      }
      return token;
    },
    // 2. A Session repassa os dados do token para o cliente (frontend)
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as UserRole;
        session.user.churchId = token.churchId as string;
        session.user.churchSlug = token.churchSlug as string;
      }
      return session;
    },
  },
});