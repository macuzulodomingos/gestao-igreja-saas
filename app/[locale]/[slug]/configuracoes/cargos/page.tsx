import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { MemberRoleService } from "@/services/memberRoleService";
import RolesClient from "@/components/Settings/Roles/RolesClient";
import { getChurchBySlug } from "@/lib/tenant";
import { getLocale } from "next-intl/server";

interface CargosPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CargosPage({ params }: CargosPageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && session.user.churchSlug !== slug) {
    notFound();
  }

  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : session.user.churchId);
  if (!church) notFound();

  const churchId = church.id;
 
  const roles = await MemberRoleService.getRoles(churchId);

  return <RolesClient initialRoles={roles} churchId={churchId} />;
}