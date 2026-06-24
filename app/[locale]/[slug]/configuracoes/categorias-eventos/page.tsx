import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { EventCategoryService } from "@/services/eventCategoryService";
import EventCategoriesClient from "@/components/Settings/EventCategories/EventCategoriesClient";
import { getChurchBySlug } from "@/lib/tenant";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventCategoriasPage({ params }: PageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) redirect("/login");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && session.user.churchSlug !== slug) {
    redirect("/login");
  }

  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : session.user.churchId);
  if (!church) notFound();
  const churchId = isSuperAdmin ? church.id : session.user.churchId;
  if (!churchId) redirect("/login");

  const categories = await EventCategoryService.getCategories(churchId);

  return <EventCategoriesClient initialCategories={categories} churchId={churchId} />;
}