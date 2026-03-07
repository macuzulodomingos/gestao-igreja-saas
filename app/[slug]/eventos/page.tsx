import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EventService } from "@/services/eventService";
import { MemberService } from "@/services/memberService";
import { DepartmentService } from "@/services/departmentService";
import EventsClient from "@/components/Events/EventsClient";

export default async function EventosPage() {
  const session = await auth();
  if (!session?.user?.churchId) redirect("/login");

  const { churchId } = session.user;

  const [events, membersData, departments] = await Promise.all([
    EventService.getEvents(churchId),
    MemberService.getMembersByChurch(churchId, 1, 100),
    DepartmentService.getDepartments(churchId),
  ]);

  return (
    <EventsClient
      initialEvents={events}
      members={membersData.members}
      departments={departments}
    />
  );
}