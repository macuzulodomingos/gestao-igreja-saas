import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);
const handleI18nRouting = createMiddleware(routing);

export default auth((req: any) => {
  const { nextUrl } = req;

  // 1. Ignora /api completamente
  if (nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 2. Ignora arquivos estáticos
  if (nextUrl.pathname.includes(".")) return NextResponse.next();

  const session = req.auth;
  const isLoggedIn = !!session;
  const role = session?.user?.role;
  const userLocale = session?.user?.locale as "pt" | "fr" | undefined;

  // 👈 Captura o estado de suporte via cookie
  const impersonatedSlug = req.cookies.get("impersonated_church_slug")?.value;
  const slug = impersonatedSlug || session?.user?.churchSlug;

  // 3. Detecta locale — prioridade: URL > cookie > padrão
  const localeFromUrl = nextUrl.pathname.startsWith("/fr") ? "fr"
    : nextUrl.pathname.startsWith("/pt") ? "pt"
    : null;

  const localeFromCookie = req.cookies.get("NEXT_LOCALE")?.value as "pt" | "fr" | undefined;
  const locale = userLocale ?? localeFromUrl ?? localeFromCookie ?? "pt";

  // Se pathname não tem prefixo — adiciona locale correcto
  if (!localeFromUrl) {
    const newUrl = new URL(`/${locale}${nextUrl.pathname}`, nextUrl);
    newUrl.search = nextUrl.search;
    return NextResponse.redirect(newUrl);
  }

  // Extrai pathname sem prefixo de locale
  const pathnameWithoutLocale = nextUrl.pathname.replace(/^\/(pt|fr)/, "") || "/";

  // 4. Se não está logado — redireciona para login com locale correcto
  if (!isLoggedIn) {
    const publicRoutes = ["/", "/login", "/registar"];
    if (publicRoutes.includes(pathnameWithoutLocale)) {
      return handleI18nRouting(req);
    }
    return NextResponse.redirect(new URL(`/${locale}/login`, nextUrl));
  }

  // 5. Gestão de Rotas Públicas para Utilizadores Autenticados
  const publicRoutes = ["/", "/login", "/registar"];
  if (publicRoutes.includes(pathnameWithoutLocale)) {
    // 👈 Se for Super Admin MAS estiver em modo suporte, mantém-no no tenant!
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

  // 6. Protege a rota /admin global
  if (pathnameWithoutLocale.startsWith("/admin")) {
    if (role !== "SUPER_ADMIN") {
      if (slug) return NextResponse.redirect(new URL(`/${locale}/${slug}/painel`, nextUrl));
      return NextResponse.redirect(new URL(`/${locale}/login`, nextUrl));
    }
    // Se for SUPER_ADMIN mas estiver a tentar forçar a entrada em /admin enquanto o cookie de suporte está ativo, 
    // decidimos se permitimos ou não. O ideal é deixar passar se ele digitar manualmente, 
    // mas se ele clicar em links do painel, a validação abaixo vai segurar.
  }

  // 7. Validação Crítica de Segurança de Tenant (Executada antes de qualquer correção de locale)
  const pathSegments = pathnameWithoutLocale.split("/").filter(Boolean);
  const currentUrlSlug = pathSegments[0];

  if (currentUrlSlug && currentUrlSlug !== "admin") {
    if (currentUrlSlug !== slug) {
      // Se houver divergência e o gajo for Super Admin sem o cookie correspondente, manda para o admin central
      if (role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL(`/${locale}/admin`, nextUrl));
      } else if (session?.user?.churchSlug) {
        return NextResponse.redirect(new URL(`/${locale}/${session.user.churchSlug}/painel`, nextUrl));
      } else {
        return NextResponse.redirect(new URL(`/${locale}/login`, nextUrl));
      }
    }
  }

  // 8. Utilizador logado com locale errado na URL — corrige automaticamente no fim
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