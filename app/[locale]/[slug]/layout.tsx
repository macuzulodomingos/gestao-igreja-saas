import { AppSidebar } from "@/components/Layout/AppSidebar";
import { DashboardHeaderClient } from "@/components/Layout/DashboardHeaderClient";
import { getChurchBySlug } from "@/lib/tenant";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { TenantClientWrapper } from "@/components/Layout/TenantClientWrapper";
import { setRequestLocale } from "next-intl/server";
import { ImpersonationService } from "@/services/impersonationService";
import { endImpersonationAction } from "@/app/actions/impersonation-actions";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string; locale: string }>;
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const session = await auth();
  const { slug, locale } = await params;

  setRequestLocale(locale);

  if (!session?.user) {
    redirect({ href: "/login", locale });
    return;
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const isCorrectChurch = session.user.churchSlug === slug;

  if (!isCorrectChurch && !isSuperAdmin) {
    if (session.user.churchSlug) {
      redirect({ href: `/${session.user.churchSlug}/painel`, locale });
    } else {
      redirect({ href: "/login", locale });
    }
    return;
  }

  // 👈 busca a igreja primeiro — necessário para validar impersonation
  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : session.user.churchId ?? undefined);

  if (!church) notFound();

  Sentry.setUser({ id: session.user.id });
  Sentry.setTag("churchSlug", church.slug);
  Sentry.setTag("churchPlan", church.plan);

  // 👈 verifica impersonation APÓS ter a igreja
  let impersonation = null;
  if (isSuperAdmin) {
    impersonation = await ImpersonationService.isImpersonating(session.user.id, slug);
    

    if (!impersonation || impersonation.churchId !== church.id) {
      redirect({ href: "/admin", locale });
      return;
    }
  }

  return (
    <>
      {/* 👈 Opção 1 — banner fixo no topo cobrindo tudo */}
      {isSuperAdmin && impersonation && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-400 text-yellow-900 px-4 py-2 flex items-center justify-between text-sm font-medium h-9 shadow-md">
          <span className="truncate pr-4">
            ⚠️ Modo Suporte — A aceder como <strong>{church.name}</strong>. Motivo: {impersonation.reason}
          </span>
          <form action={endImpersonationAction} className="shrink-0">
            <button type="submit" className="underline font-bold hover:text-yellow-950 transition-colors">
              Sair do Modo Suporte
            </button>
          </form>
        </div>
      )}

      <TenantClientWrapper>
        <div className="min-h-screen flex w-full bg-background" suppressHydrationWarning>
          <AppSidebar slug={slug} initialRole={session.user.role} />
          <div className="flex-1 flex flex-col min-w-0">
            <DashboardHeaderClient church={church} user={session.user} />
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </TenantClientWrapper>
    </>
  );
}



