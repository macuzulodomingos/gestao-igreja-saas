import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { EventService } from "@/services/eventService";
import { MemberService } from "@/services/memberService";
import { DepartmentService } from "@/services/departmentService";
import EventsClient from "@/components/Events/EventsClient";
import { EventCategoryService } from "@/services/eventCategoryService"; // 👈 NOVO
import prisma from "@/lib/prisma";
import { getChurchBySlug } from "@/lib/tenant";

interface EventosPageProps {
  params: Promise<{ slug: string }>; // 👈 adiciona
}

export default async function EventosPage({ params }: EventosPageProps) {

  const session = await auth();
  const { slug } = await params; // 👈 adiciona

  if (!session?.user) redirect("/login");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && session.user.churchSlug !== slug) {
    redirect("/login");
  }

  // 👈 SUPER_ADMIN busca churchId pelo slug
  let churchId = session.user.churchId;
  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : churchId);
  if (!church) notFound();
  if (isSuperAdmin) churchId = church.id;

  if (!churchId) redirect("/login");

  const timezone = church?.timezone ?? "Africa/Luanda";

  const [events, membersData, departments, categories] = await Promise.all([
    EventService.getEvents(churchId, timezone),
    MemberService.getMembersByChurch(churchId, 1, 100),
    DepartmentService.getDepartments(churchId),
    EventCategoryService.getCategories(churchId),
  ]);



  return (
    <EventsClient
      initialEvents={events}
      members={membersData.members}
      departments={departments}
      categories={categories} // 👈 NOVO
      timezone={church?.timezone ?? "Africa/Luanda"}
      churchId={churchId}
    />
  );
}