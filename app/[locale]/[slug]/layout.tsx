import { AppSidebar } from "@/components/Layout/AppSidebar";
import { DashboardHeaderClient } from "@/components/Layout/DashboardHeaderClient";
import { getChurchBySlug } from "@/lib/tenant";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TenantClientWrapper } from "@/components/Layout/TenantClientWrapper";
import { setRequestLocale } from "next-intl/server";
import { ImpersonationService } from "@/services/impersonationService";
import { endImpersonationAction } from "@/app/actions/impersonation-actions";

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
    redirect(`/${locale}/login`);
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  // 👈 busca a igreja primeiro — necessário para validar impersonation
  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : session.user.churchId ?? undefined);

  if (!church) notFound();

  // 👈 verifica impersonation APÓS ter a igreja
  let impersonation = null;
  if (isSuperAdmin) {
    impersonation = await ImpersonationService.isImpersonating(session.user.id);

    if (!impersonation || impersonation.churchId !== church.id) {
      redirect(`/${locale}/admin`);
    }
  }

  const isCorrectChurch = session.user.churchSlug === slug;

  if (!isCorrectChurch && !isSuperAdmin) {
    if (session.user.churchSlug) {
      redirect(`/${locale}/${session.user.churchSlug}/painel`);
    } else {
      redirect(`/${locale}/login`);
    }
  }

  return (
    <>
      {/* 👈 banner de impersonation */}
      {isSuperAdmin && impersonation && (
        <div className="bg-yellow-400 text-yellow-900 px-4 py-2 flex items-center justify-between text-sm font-medium">
          <span>
            ⚠️ Modo Suporte — A aceder como esta igreja. Motivo: {impersonation.reason}
          </span>
          <form action={endImpersonationAction.bind(null, impersonation.id)}>
            <button type="submit" className="underline font-bold">
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



