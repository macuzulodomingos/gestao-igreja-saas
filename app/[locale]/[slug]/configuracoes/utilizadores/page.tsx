import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { UserService } from "@/services/userService";
import UsersClient from "@/components/Settings/Users/UsersClient";
import { getChurchBySlug } from "@/lib/tenant";
import { getLocale } from "next-intl/server";
import { UserRole } from "@/app/generated/prisma/enums";

interface UtilizadoresPageProps {
  params: Promise<{ slug: string }>;
}

export default async function UtilizadoresPage({ params }: UtilizadoresPageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
    return; 
  }

  const user = session.user; 

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && user.churchSlug !== slug) {
    notFound();
  }

  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role!)) {
    notFound();
  }

  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : user.churchId);
  if (!church) notFound();

  const churchId = church.id;

  const users = await UserService.getUsers(churchId);

  return (
    <UsersClient
      initialUsers={users}
      currentUserId={user.id}
      currentUserRole={user.role as UserRole}
      churchId={churchId}
    />
  );
}