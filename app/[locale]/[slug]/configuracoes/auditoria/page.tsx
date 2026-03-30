import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuditService } from "@/services/auditService";
import AuditoriaClient from "@/components/Settings/Audit/AuditoriaClient";

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
  if (!session?.user?.churchId) redirect("/login");

  const sParams = await searchParams;
  const page = Number(sParams.page) || 1;

  const { logs, metadata } = await AuditService.getChurchLogs(
    session.user.churchId,
    {
      entityName: sParams.entityName,
      action: sParams.action,
      page,
      limit: 20,
    }
  );

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