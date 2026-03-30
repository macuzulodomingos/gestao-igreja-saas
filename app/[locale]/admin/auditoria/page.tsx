import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuditoriaClient } from "@/components/Admin/AuditoriaClient";
import prisma from "@/lib/prisma";

export default async function AdminAuditoriaPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      churchId: true,
      userId: true,
      userEmail: true,
      action: true,
      entityName: true,
      entityId: true,
      oldData: true,
      newData: true,
      createdAt: true,
      church: { select: { name: true, slug: true } },
    },
  });

  return <AuditoriaClient initialLogs={logs} />;
}