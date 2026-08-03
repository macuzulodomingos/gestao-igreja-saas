import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);
const handleI18nRouting = createMiddleware(routing);

// Única fonte de verdade para rotas públicas — evita duplicação e
// divergência entre os blocos que checam isLoggedIn e utilizadores autenticados.
const PUBLIC_ROUTES = ["/", "/login", "/registar", "/esqueci-senha", "/redefinir-senha"];

export default auth((req: any) => {
  const { nextUrl } = req;

  if (nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (nextUrl.pathname.includes(".")) return NextResponse.next();

  const session = req.auth;
  const isLoggedIn = !!session;
  const role = session?.user?.role;
  const userLocale = session?.user?.locale as "pt" | "fr" | undefined;

  const impersonatedSlug = req.cookies.get("impersonated_church_slug")?.value;
  const slug = impersonatedSlug || session?.user?.churchSlug;

  const localeFromUrl = nextUrl.pathname.startsWith("/fr") ? "fr"
    : nextUrl.pathname.startsWith("/pt") ? "pt"
      : null;

  const localeFromCookie = req.cookies.get("NEXT_LOCALE")?.value as "pt" | "fr" | undefined;
  const locale = userLocale ?? localeFromUrl ?? localeFromCookie ?? "pt";

  if (!localeFromUrl) {
    const newUrl = nextUrl.clone();
    newUrl.pathname = `/${locale}${nextUrl.pathname}`;
    return NextResponse.redirect(newUrl);
  }

  const pathnameWithoutLocale = nextUrl.pathname.replace(/^\/(pt|fr)/, "") || "/";

  if (!isLoggedIn) {
    if (PUBLIC_ROUTES.includes(pathnameWithoutLocale)) {
      return handleI18nRouting(req);
    }
    return NextResponse.redirect(new URL(`/${locale}/login`, nextUrl));
  }

  if (PUBLIC_ROUTES.includes(pathnameWithoutLocale)) {
    if (role === "SUPER_ADMIN" && impersonatedSlug) {
      return NextResponse.redirect(new URL(`/${locale}/${impersonatedSlug}/painel`, nextUrl));
    }
    if (role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(`/${locale}/admin`, nextUrl));
    }
    if (slug) {
      return NextResponse.redirect(new URL(`/${locale}/${slug}/painel`, nextUrl));
    }
    return handleI18nRouting(req);
  }

  if (pathnameWithoutLocale.startsWith("/admin")) {
    if (role !== "SUPER_ADMIN") {
      if (slug) return NextResponse.redirect(new URL(`/${locale}/${slug}/painel`, nextUrl));
      return NextResponse.redirect(new URL(`/${locale}/login`, nextUrl));
    }
  }

  const pathSegments = pathnameWithoutLocale.split("/").filter(Boolean);
  const currentUrlSlug = pathSegments[0];

  if (currentUrlSlug && currentUrlSlug !== "admin") {
    if (currentUrlSlug !== slug) {
      if (role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL(`/${locale}/admin`, nextUrl));
      } else if (session?.user?.churchSlug) {
        return NextResponse.redirect(new URL(`/${locale}/${session.user.churchSlug}/painel`, nextUrl));
      } else {
        return NextResponse.redirect(new URL(`/${locale}/login`, nextUrl));
      }
    }
  }

  if (userLocale && localeFromUrl !== userLocale) {
    const newUrl = new URL(`/${userLocale}${pathnameWithoutLocale}`, nextUrl);
    newUrl.search = nextUrl.search;
    return NextResponse.redirect(newUrl);
  }

  return handleI18nRouting(req);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};