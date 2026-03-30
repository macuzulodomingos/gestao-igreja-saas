import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserService } from "@/services/userService";
import UsersClient from "@/components/Settings/Users/UsersClient";

interface UtilizadoresPageProps {
  params: Promise<{ slug: string }>;
}

export default async function UtilizadoresPage({ params }: UtilizadoresPageProps) {
  const session = await auth();
  if (!session?.user?.churchId) redirect("/login");

  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role!)) {
    redirect(`/login`);
  }

  const users = await UserService.getUsers(session.user.churchId);

  return (
    <UsersClient
      initialUsers={users}
      currentUserId={session.user.id}
    />
  );
}