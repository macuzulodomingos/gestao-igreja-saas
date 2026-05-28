import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { UserService } from "@/services/userService";
import UsersClient from "@/components/Settings/Users/UsersClient";
import { getChurchBySlug } from "@/lib/tenant";

interface UtilizadoresPageProps {
  params: Promise<{ slug: string }>;
}

export default async function UtilizadoresPage({ params }: UtilizadoresPageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) redirect("/login");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && session.user.churchSlug !== slug) {
    redirect("/login");
  }

  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role!)) {
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

  const users = await UserService.getUsers(churchId);

  return (
    <UsersClient
      initialUsers={users}
      currentUserId={session.user.id}
      churchId={churchId} // 👈 passa churchId
    />
  );
}