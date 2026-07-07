import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
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
 
  const roles = await MemberRoleService.getRoles(churchId);

  return <RolesClient initialRoles={roles} churchId={churchId} />;
}