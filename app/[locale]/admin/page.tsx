import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { SuperAdminService } from "@/services/superAdminService";
import AdminClient from "@/components/Admin/AdminClient";
import { getLocale } from "next-intl/server";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
    return;
  }

  if (session.user.role !== "SUPER_ADMIN") {
    notFound();
  }

  const sParams = await searchParams;
  const parsedPage = Number(sParams.page) || 1;
  const page = parsedPage < 1 ? 1 : parsedPage;

  const [stats, { churches, metadata }] = await Promise.all([
    SuperAdminService.getGlobalStats(),
    SuperAdminService.getChurches(page, 20, sParams.search),
  ]);

  return (
    <AdminClient
      stats={stats}
      initialChurches={churches}
      metadata={metadata}
      filters={{ search: sParams.search ?? "" }}
    />
  );
}