import { AppSidebar } from "@/components/Layout/AppSidebar";
import { DashboardHeader } from "@/components/Layout/DashboardHeader";
import { getChurchBySlug } from "@/lib/tenant";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TenantClientWrapper } from "@/components/Layout/TenantClientWrapper";

// ✅ Isso impede o cache de mostrar o menu vazio
export const dynamic = "force-dynamic";

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const isCorrectChurch = session.user.churchSlug === slug;

  if (!isCorrectChurch && !isSuperAdmin) {
    if (session.user.churchSlug) {
      redirect(`/${session.user.churchSlug}/painel`);
    } else {
      redirect("/login");
    }
  }

  const church = await getChurchBySlug(slug, session.user.churchId ?? undefined);

  if (!church) {
    return notFound();
  }

  return (
    <TenantClientWrapper>
      {/* O suppressHydrationWarning evita que extensões de terceiros quebrem o app */}
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