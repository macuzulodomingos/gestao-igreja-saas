//middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);
const handleI18nRouting = createMiddleware(routing);

export default auth((req: any) => {
  const session = req.auth;
  const { nextUrl } = req;
  const isLoggedIn = !!session;
  const role = session?.user?.role;
  const slug = session?.user?.churchSlug;

  // 1. Ignora arquivos estáticos
  if (nextUrl.pathname.includes(".")) return NextResponse.next();

  // 2. Detecta locale — prioridade: URL > cookie > padrão
  const localeFromUrl = nextUrl.pathname.startsWith("/fr") ? "fr"
    : nextUrl.pathname.startsWith("/pt") ? "pt"
    : null;

  const localeFromCookie = req.cookies.get("NEXT_LOCALE")?.value as "pt" | "fr" | undefined;
  const locale = localeFromUrl ?? localeFromCookie ?? "pt";

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

  // 7. Se está em /pt mas o cookie diz /fr — redireciona
  if (localeFromUrl && localeFromCookie && localeFromUrl !== localeFromCookie) {
    const newUrl = new URL(
      `/${localeFromCookie}${pathnameWithoutLocale}`,
      nextUrl
    );
    return NextResponse.redirect(newUrl);
  }

  return handleI18nRouting(req);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};