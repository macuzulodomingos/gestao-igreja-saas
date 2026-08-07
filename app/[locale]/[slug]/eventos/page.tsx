import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { EventService } from "@/services/eventService";
import { MemberService } from "@/services/memberService";
import { DepartmentService } from "@/services/departmentService";
import EventsClient from "@/components/Events/EventsClient";
import { EventCategoryService } from "@/services/eventCategoryService"; // 👈 NOVO
import { getChurchBySlug } from "@/lib/tenant";
import { getLocale } from "next-intl/server";

interface EventosPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function EventosPage({ params, searchParams }: EventosPageProps) {

  const session = await auth();
  const { slug } = await params; // 👈 adiciona
  const sParams = await searchParams;

  if (!session?.user) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
    return;
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

  const now = new Date();
  const currentYear = now.getFullYear();

  const parsedMonth = Number(sParams.month) || now.getMonth() + 1;
  const month = parsedMonth < 1 || parsedMonth > 12 ? now.getMonth() + 1 : parsedMonth;

  const parsedYear = Number(sParams.year) || currentYear;
  const year = parsedYear < 2000 || parsedYear > currentYear + 1 ? currentYear : parsedYear;

  const [events, departments, categories] = await Promise.all([
    EventService.getEvents(churchId, timezone, month, year),
    DepartmentService.getDepartments(churchId),
    EventCategoryService.getCategories(churchId),
  ]);



  return (
    <EventsClient
      initialEvents={events}
      departments={departments}
      categories={categories}
      timezone={timezone}
      churchId={churchId}
      currentMonth={month}
      currentYear={year}
    />
  );
}