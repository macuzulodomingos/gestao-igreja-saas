import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { UserService } from "@/services/userService";
import UsersClient from "@/components/Settings/Users/UsersClient";
import { getChurchBySlug } from "@/lib/tenant";
import { getLocale } from "next-intl/server";

interface UtilizadoresPageProps {
  params: Promise<{ slug: string }>;
}

export default async function UtilizadoresPage({ params }: UtilizadoresPageProps) {
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

  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role!)) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : session.user.churchId);
  if (!church) notFound();

  const churchId = church.id;

  const users = await UserService.getUsers(churchId);

  return (
    <UsersClient
      initialUsers={users}
      currentUserId={session.user.id}
      churchId={churchId}
    />
  );
}