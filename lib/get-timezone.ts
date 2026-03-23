import prisma from "@/lib/prisma";

export async function getTimezone(churchId: string): Promise<string> {
  const church = await prisma.church.findUnique({
    where: { id: churchId },
    select: { timezone: true },
  });
  return church?.timezone ?? "Africa/Luanda";
}