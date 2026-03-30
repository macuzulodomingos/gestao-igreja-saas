import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MemberRoleService } from "@/services/memberRoleService";
import RolesClient from "@/components/Settings/Roles/RolesClient";

export default async function CargosPage() {
  const session = await auth();
  if (!session?.user?.churchId) redirect("/login");

  const roles = await MemberRoleService.getRoles(session.user.churchId);

  return <RolesClient initialRoles={roles} />;
}