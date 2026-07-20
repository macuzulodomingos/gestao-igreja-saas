import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { DepartmentService } from "@/services/departmentService";
import { MemberService } from "@/services/memberService";
import DepartmentsClient from "@/components/Departments/DepartmentsClient";
import { getChurchBySlug } from "@/lib/tenant";
import { getLocale } from "next-intl/server";

interface DepartamentosPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DepartamentosPage({ params }: DepartamentosPageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
    return;
  }


  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && session.user.churchSlug !== slug) {
    notFound();
  }

  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : session.user.churchId);
  if (!church) notFound();
  const churchId = church.id;


  const [departments, activeMembersCount] = await Promise.all([
    DepartmentService.getDepartments(churchId),
    MemberService.countActiveMembers(churchId),
  ]);

  return (
    <DepartmentsClient
      initialDepartments={departments}
      activeMembersCount={activeMembersCount}
      churchId={churchId}
    />
  );
}