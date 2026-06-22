import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { AuditService } from "@/services/auditService";
import AuditoriaClient from "@/components/Settings/Audit/AuditoriaClient";
import { getChurchBySlug } from "@/lib/tenant";


interface AuditoriaPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    entityName?: string;
    action?: string;
  }>;
}

export default async function AuditoriaPage({
  params,
  searchParams,
}: AuditoriaPageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) redirect("/login");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && session.user.churchSlug !== slug) {
    notFound();
  }

  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : session.user.churchId);
  if (!church) notFound();
  const churchId = isSuperAdmin ? church.id : session.user.churchId;
  if (!churchId) redirect("/login");

  const sParams = await searchParams;
  const rawPage = Number(sParams.page);
  const page = !isNaN(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;



  const { logs, metadata } = await AuditService.getChurchLogs(churchId, {
    entityName: sParams.entityName,
    action: sParams.action,
    page,
    limit: 20,
  });

  return (
    <AuditoriaClient
      initialLogs={logs}
      metadata={metadata}
      filters={{
        entityName: sParams.entityName ?? "",
        action: sParams.action ?? "",
      }}
    />
  );
}