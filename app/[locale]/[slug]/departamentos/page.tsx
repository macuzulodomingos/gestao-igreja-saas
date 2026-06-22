import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { DepartmentService } from "@/services/departmentService";
import { MemberService } from "@/services/memberService";
import DepartmentsClient from "@/components/Departments/DepartmentsClient";
import { getChurchBySlug } from "@/lib/tenant";

interface DepartamentosPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DepartamentosPage({ params }: DepartamentosPageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) redirect("/login");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && session.user.churchSlug !== slug) {
    notFound();
  }

  let churchId = session.user.churchId;
  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : churchId);
  if (!church) notFound();
  if (isSuperAdmin) churchId = church.id;

  if (!churchId) redirect("/login");


  const [departments, membersData] = await Promise.all([
    DepartmentService.getDepartments(churchId),
    MemberService.getMembersByChurch(churchId, 1, 100), // busca até 100 membros para o select
  ]);

  return (
    <DepartmentsClient
      initialDepartments={departments}
      members={membersData.members}
      churchId={churchId}
    />
  );
}