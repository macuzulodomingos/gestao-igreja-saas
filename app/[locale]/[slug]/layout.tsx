import { AppSidebar } from "@/components/Layout/AppSidebar";
import { DashboardHeader } from "@/components/Layout/DashboardHeader";
import { getChurchBySlug } from "@/lib/tenant";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TenantClientWrapper } from "@/components/Layout/TenantClientWrapper";
import { setRequestLocale } from "next-intl/server";


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

  // 👈 configura locale imediatamente após receber dos params
  setRequestLocale(locale);

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const isCorrectChurch = session.user.churchSlug === slug;

  if (!isCorrectChurch && !isSuperAdmin) {
    if (session.user.churchSlug) {
      redirect(`/${locale}/${session.user.churchSlug}/painel`);
    } else {
      redirect(`/${locale}/login`);
    }
  }

  const church = await getChurchBySlug(slug, session.user.churchId ?? undefined);

  if (!church) {
     notFound();
  }

  return (
    <TenantClientWrapper>
      <div className="min-h-screen flex w-full bg-background" suppressHydrationWarning>
        <AppSidebar slug={slug} initialRole={session.user.role} />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader church={church} user={session.user} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </TenantClientWrapper>
  );
}






