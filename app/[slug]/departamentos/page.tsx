import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DepartmentService } from "@/services/departmentService";
import { MemberService } from "@/services/memberService";
import DepartmentsClient from "@/components/Departments/DepartmentsClient";

export default async function DepartamentosPage() {
  const session = await auth();
  if (!session?.user?.churchId) redirect("/login");

  const { churchId } = session.user;

  const [departments, membersData] = await Promise.all([
    DepartmentService.getDepartments(churchId),
    MemberService.getMembersByChurch(churchId, 1, 100), // busca até 100 membros para o select
  ]);

  return (
    <DepartmentsClient
      initialDepartments={departments}
      members={membersData.members}
    />
  );
}