import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { MemberRoleService } from "@/services/memberRoleService";
import RolesClient from "@/components/Settings/Roles/RolesClient";
import { getChurchBySlug } from "@/lib/tenant";

interface CargosPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CargosPage({ params }: CargosPageProps) {
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
    churchId = church.id;
  } else {
    const church = await getChurchBySlug(slug, churchId);
    if (!church) notFound();
  }

  if (!churchId) redirect("/login");

 

  const roles = await MemberRoleService.getRoles(churchId);

  return <RolesClient initialRoles={roles} churchId={churchId} />;
}