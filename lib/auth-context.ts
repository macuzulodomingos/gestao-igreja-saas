import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function getAuthContext(targetChurchId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const churchId = isSuperAdmin && targetChurchId
    ? targetChurchId
    : session.user.churchId;

  if (!churchId) throw new Error("CHURCH_ID_REQUIRED");

  // 👈 SUPER_ADMIN sem targetChurchId não tem timezone
  const church = isSuperAdmin && !targetChurchId
    ? null
    : await prisma.church.findUnique({
        where: { id: churchId },
        select: { timezone: true },
      });

  // 👈 SUPER_ADMIN usa o seu próprio timezone
  // ADMIN usa o timezone da igreja
  const timezone = isSuperAdmin && !targetChurchId
    ? (session.user.timezone ?? "Africa/Luanda")
    : (church?.timezone ?? "Africa/Luanda");

  return {
    churchId,
    timezone,
    actor: { userId: session.user.id, email: session.user.email! },
    isSuperAdmin,
  };
}