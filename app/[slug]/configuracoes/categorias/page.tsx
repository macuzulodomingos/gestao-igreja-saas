import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FinanceCategoryService } from "@/services/financeCategoryService";
import CategoriesClient from "@/components/Settings/Categories/CategoriesClient";

export default async function CategoriasPage() {
  const session = await auth();
  if (!session?.user?.churchId) redirect("/login");

  const categories = await FinanceCategoryService.getCategories(session.user.churchId);

  return <CategoriesClient initialCategories={categories} />;
}