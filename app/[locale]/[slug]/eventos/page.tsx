import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EventService } from "@/services/eventService";
import { MemberService } from "@/services/memberService";
import { DepartmentService } from "@/services/departmentService";
import EventsClient from "@/components/Events/EventsClient";
import { EventCategoryService } from "@/services/eventCategoryService"; // 👈 NOVO
import prisma from "@/lib/prisma";

export default async function EventosPage() {
  const session = await auth();
  if (!session?.user?.churchId) redirect("/login");

  const { churchId } = session.user;

  const [events, membersData, departments, categories, church] = await Promise.all([
    EventService.getEvents(churchId),
    MemberService.getMembersByChurch(churchId, 1, 100),
    DepartmentService.getDepartments(churchId),
    EventCategoryService.getCategories(churchId),
    prisma.church.findUnique({
      where: { id: churchId },
      select: { timezone: true },
    }),
  ]);


  return (
    <EventsClient
      initialEvents={events}
      members={membersData.members}
      departments={departments}
      categories={categories} // 👈 NOVO
      timezone={church?.timezone ?? "Africa/Luanda"} // 👈 NOVO
    />
  );
}