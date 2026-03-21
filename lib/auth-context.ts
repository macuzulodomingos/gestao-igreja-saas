import { auth } from "@/lib/auth";

export async function getAuthContext(targetChurchId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const churchId = isSuperAdmin && targetChurchId
    ? targetChurchId
    : session.user.churchId;

  if (!churchId) throw new Error("CHURCH_ID_REQUIRED");

  return {
    churchId,
    actor: { userId: session.user.id, email: session.user.email! },
    isSuperAdmin,
  };
}