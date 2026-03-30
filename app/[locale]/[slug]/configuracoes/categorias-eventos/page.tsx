import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EventCategoryService } from "@/services/eventCategoryService";
import EventCategoriesClient from "@/components/Settings/EventCategories/EventCategoriesClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventCategoriasPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.churchId) redirect("/login");

  const categories = await EventCategoryService.getCategories(session.user.churchId);

  return <EventCategoriesClient initialCategories={categories} />;
}