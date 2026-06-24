import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { FinanceCategoryService } from "@/services/financeCategoryService";
import CategoriesClient from "@/components/Settings/Categories/CategoriesClient";
import { getChurchBySlug } from "@/lib/tenant";

interface CategoriasPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoriasPage({ params }: CategoriasPageProps) {
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

  const categories = await FinanceCategoryService.getCategories(churchId);

  return <CategoriesClient initialCategories={categories} churchId={churchId} />;
}