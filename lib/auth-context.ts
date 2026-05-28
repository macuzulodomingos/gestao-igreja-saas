import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PlanType } from "@/lib/plans";

export async function getAuthContext(targetChurchId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  // 👈 SUPER_ADMIN no painel global — sem targetChurchId
  if (isSuperAdmin && !targetChurchId) {
    return {
      churchId: "",
      plan: "ENTERPRISE" as PlanType,
      actor: { userId: session.user.id, email: session.user.email! },
      isSuperAdmin: true,
    };
  }

  const churchId = isSuperAdmin && targetChurchId
    ? targetChurchId
    : session.user.churchId;

  if (!churchId) throw new Error("CHURCH_ID_REQUIRED");

  // 👈 busca plan junto com churchId — uma única query
  const church = await prisma.church.findUnique({
    where: { id: churchId },
    select: { plan: true },
  });


  return {
    churchId,
    plan: (church?.plan ?? "FREE") as PlanType, // 👈 NOVO
    actor: { userId: session.user.id, email: session.user.email! },
    isSuperAdmin,
  };
}