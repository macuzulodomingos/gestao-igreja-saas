// middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

// 1. Inicializa o Auth.js com a config leve (Edge-compatible)
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;

  // 2. Proteção de performance (ignorar arquivos estáticos)
  if (nextUrl.pathname.includes('.')) return NextResponse.next();

  // 3. Lógica de Redirecionamento (Ponto que você precisava)
  if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/")) {
    const role = session.user?.role;
    const slug = session.user?.churchSlug;

    if (role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }

    if (slug) {
      return NextResponse.redirect(new URL(`/${slug}/painel`, nextUrl));
    }
  }

  // 4. Se não logado, bloqueia tudo exceto login e home
  if (!isLoggedIn && nextUrl.pathname !== "/login" && nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Matcher padrão recomendado pela Vercel/Auth.js
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};