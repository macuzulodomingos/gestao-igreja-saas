import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { BillingService } from "@/services/billingService";
import { AdminBillingClient } from "@/components/Billing/AdminBillingClient";
import { getLocale } from "next-intl/server";

export default async function AdminBillingPage() {
  const session = await auth();
  
  if (!session?.user) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
    return;
  }

  if (session.user.role !== "SUPER_ADMIN") {
    notFound();
  }

  const pendingPayments = await BillingService.getPendingPayments();

  return <AdminBillingClient pendingPayments={pendingPayments} />;
}