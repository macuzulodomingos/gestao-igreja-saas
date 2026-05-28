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
    redirect("/login");
  }

  let churchId = session.user.churchId;

  if (isSuperAdmin) {
    const church = await getChurchBySlug(slug, undefined);
    if (!church) notFound();
    churchId = church.id; // 👈 TypeScript sabe que church não é null aqui
  } else {
    const church = await getChurchBySlug(slug, churchId);
    if (!church) notFound();
  }

  if (!churchId) redirect("/login");

  const sParams = await searchParams;
  const page = Number(sParams.page) || 1;


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