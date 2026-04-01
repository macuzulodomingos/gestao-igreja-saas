import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);
const handleI18nRouting = createMiddleware(routing);

export default auth((req: any) => {
  const { nextUrl } = req;

  // 👈 ignora /api completamente — NextAuth precisa de gerir /api/auth/*
  if (nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const session = req.auth;
  const isLoggedIn = !!session;
  const role = session?.user?.role;
  const slug = session?.user?.churchSlug;
  const userLocale = session?.user?.locale as "pt" | "fr" | undefined;

  // 1. Ignora arquivos estáticos
  if (nextUrl.pathname.includes(".")) return NextResponse.next();

  // 2. Detecta locale — prioridade: URL > cookie > padrão
  const localeFromUrl = nextUrl.pathname.startsWith("/fr") ? "fr"
    : nextUrl.pathname.startsWith("/pt") ? "pt"
    : null;

  const localeFromCookie = req.cookies.get("NEXT_LOCALE")?.value as "pt" | "fr" | undefined;
  // 👈 prioridade: locale do utilizador (DB) > URL > cookie > padrão
  const locale = userLocale ?? localeFromUrl ?? localeFromCookie ?? "pt";

  // Se pathname não tem prefixo — adiciona locale correcto
  if (!localeFromUrl) {
    const newUrl = new URL(`/${locale}${nextUrl.pathname}`, nextUrl);
    newUrl.search = nextUrl.search;
    return NextResponse.redirect(newUrl);
  }

  // 3. Extrai pathname sem prefixo de locale
  const pathnameWithoutLocale =
    nextUrl.pathname.replace(/^\/(pt|fr)/, "") || "/";

  // 4. Rotas públicas
  const publicRoutes = ["/", "/login", "/registar"];
  if (publicRoutes.includes(pathnameWithoutLocale)) {
    if (isLoggedIn) {
      if (role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL(`/${locale}/admin`, nextUrl));
      }
      if (slug) {
        return NextResponse.redirect(
          new URL(`/${locale}/${slug}/painel`, nextUrl)
        );
      }
    }
    return handleI18nRouting(req);
  }

  // 5. Se não logado — redireciona para login com locale correcto
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale}/login`, nextUrl));
  }

  // 6. Protege /admin
  if (pathnameWithoutLocale.startsWith("/admin") && role !== "SUPER_ADMIN") {
    if (slug) {
      return NextResponse.redirect(
        new URL(`/${locale}/${slug}/painel`, nextUrl)
      );
    }
    return NextResponse.redirect(new URL(`/${locale}/login`, nextUrl));
  }

  // 👈 utilizador logado com locale errado na URL — corrige automaticamente
  if (isLoggedIn && userLocale && localeFromUrl !== userLocale) {
    const newUrl = new URL(`/${userLocale}${pathnameWithoutLocale}`, nextUrl);
    return NextResponse.redirect(newUrl);
  }

  return handleI18nRouting(req);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};