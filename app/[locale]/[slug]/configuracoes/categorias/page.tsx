import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { FinanceCategoryService } from "@/services/financeCategoryService";
import CategoriesClient from "@/components/Settings/Categories/CategoriesClient";
import { getChurchBySlug } from "@/lib/tenant";
import { getLocale } from "next-intl/server";

interface CategoriasPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoriasPage({ params }: CategoriasPageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
    return;
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && session.user.churchSlug !== slug) {
     notFound();
  }

  const church = await getChurchBySlug(slug, isSuperAdmin ? undefined : session.user.churchId);
  if (!church) notFound();
  const churchId = church.id;

  const categories = await FinanceCategoryService.getCategories(churchId);

  return <CategoriesClient initialCategories={categories} churchId={churchId} />;
}