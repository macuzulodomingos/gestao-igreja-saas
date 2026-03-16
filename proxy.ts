// middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const session = req.auth;
  const { nextUrl } = req;
  const isLoggedIn = !!session;
  const role = session?.user?.role;
  const slug = session?.user?.churchSlug;

  // 1. Ignora arquivos estáticos
  if (nextUrl.pathname.includes('.')) return NextResponse.next();

  // 2. Rotas públicas — sempre acessíveis
  const publicRoutes = ["/", "/login", "/registar"];
  if (publicRoutes.includes(nextUrl.pathname)) {
    if (isLoggedIn) {
      if (role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin", nextUrl));
      }
      if (slug) {
        return NextResponse.redirect(new URL(`/${slug}/painel`, nextUrl));
      }
    }
    return NextResponse.next();
  }

  // 3. Se não logado, bloqueia tudo
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // 4. Protege /admin — só SUPER_ADMIN
  if (nextUrl.pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
    if (slug) {
      return NextResponse.redirect(new URL(`/${slug}/painel`, nextUrl));
    }
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};