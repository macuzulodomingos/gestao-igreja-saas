// lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

import { authConfig } from "./auth.config";
import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";

import { UserRole } from "@/app/generated/prisma/enums";



const REFRESH_INTERVAL = 60 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig, // Puxa as páginas e o callback authorized do config leve
  adapter: PrismaAdapter(prisma as unknown as Parameters<typeof PrismaAdapter>[0]),
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8 horas
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: {
            email: String(email),
          },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            deletedAt: true,
            churchId: true,
            locale: true,
            church: {
              select: {
                slug: true,
              },
            },
          },
        });

        // 🛡️ hash falso — mantém tempo de resposta consistente
        if (!user || !user.password) {
          await bcrypt.compare(
            password as string,
            "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
          );
          return null;
        }

        if (user.deletedAt) return null; // 👈 bloqueia utilizadores eliminados

        const passwordMatch = await bcrypt.compare(password as string, user.password);

        if (!passwordMatch) return null; // 👈 mais legível do que o if/else
        // 2. Bloqueia utilizadores sem igreja (excepto SUPER_ADMIN)
        if (user.role !== "SUPER_ADMIN" && !user.churchId) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          churchId: user.churchId ?? null,
          churchSlug: user.church?.slug ?? null,
          locale: user.locale ?? "pt",
        };
      },
    }),
  ],
  callbacks: {
    // 1. O JWT recebe os dados do 'user' vindo do authorize e guarda no token
    async jwt({ token, user, trigger }) {
      // Login inicial — popula o token
      if (user) {
        token.role = user.role as UserRole;
        token.churchId = user.churchId ?? null;
        token.churchSlug = user.churchSlug ?? null;
        token.refreshedAt = Date.now();
        token.locale = user.locale ?? "pt";

        return token;
      }


      // Verifica se precisa re-validar
      const lastRefresh = typeof token.refreshedAt === "number" ? token.refreshedAt : 0;

      if (Date.now() <= lastRefresh + REFRESH_INTERVAL) {
        return token;
      }

      // Re-validação na DB — resolve session drift
      if (!token.sub) return null; // 👈 seguro, sem bang operator

      const dbUser = await prisma.user.findUnique({
        where: {
          id: token.sub,
        },
        select: {
          role: true,
          churchId: true,
          locale: true,
          deletedAt: true,
          church: {
            select: {
              slug: true,
            },
          },
        },
      });

      // Utilizador apagado ou desactivado — invalida token
      if (!dbUser || dbUser.deletedAt) return null;

      // Actualiza token com dados frescos da DB
      token.role = dbUser.role as UserRole;
      token.churchId = dbUser.churchId ?? null;
      token.churchSlug = dbUser.church?.slug ?? null;
      token.locale = dbUser.locale ?? "pt"; // 👈 actualiza locale no refresh
      token.refreshedAt = Date.now();

      return token;
    },
    // 2. A Session repassa os dados do token para o cliente (frontend)
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as UserRole;
        session.user.churchId =
          typeof token.churchId === "string"
            ? token.churchId
            : null;

        session.user.churchSlug =
          typeof token.churchSlug === "string"
            ? token.churchSlug
            : null;
        session.user.locale =
          typeof token.locale === "string"
            ? token.locale
            : "pt";
      }
      return session;
    },
  },
});