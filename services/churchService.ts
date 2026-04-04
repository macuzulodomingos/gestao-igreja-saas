import prisma from "@/lib/prisma";

export const ChurchService = {
  async updateSettings(
    churchId: string,
    data: { name: string; timezone: string }
  ) {
    return prisma.church.update({
      where: { id: churchId },
      data: {
        name: data.name,
        timezone: data.timezone,
      },
    });
  },

 
};