import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { EventService } from "@/services/eventService";
import { MemberService } from "@/services/memberService";
import { DepartmentService } from "@/services/departmentService";
import EventsClient from "@/components/Events/EventsClient";
import { EventCategoryService } from "@/services/eventCategoryService"; // 👈 NOVO
import { getChurchBySlug } from "@/lib/tenant";
import { getLocale } from "next-intl/server";

interface EventosPageProps {
  params: Promise<{ slug: string }>; // 👈 adiciona
}

export default async function EventosPage({ params }: EventosPageProps) {

  const session = await auth();
  const { slug } = await params; // 👈 adiciona

  if (!session?.user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && session.user.churchSlug !== slug) {
    notFound();
  }

  // 👈 SUPER_ADMIN busca churchId pelo slug
  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : session.user.churchId);
  if (!church) notFound();
  const churchId = church.id;

  const timezone = church.timezone || "Africa/Luanda";

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
      categories={categories}
      timezone={timezone}
      churchId={churchId}
    />
  );
}