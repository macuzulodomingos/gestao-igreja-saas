import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SuperAdminService } from "@/services/superAdminService";
import AdminClient from "@/components/Admin/AdminClient";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const sParams = await searchParams;
  const page = Number(sParams.page) || 1;

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