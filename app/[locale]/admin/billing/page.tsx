import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BillingService } from "@/services/billingService";
import { AdminBillingClient } from "@/components/Billing/AdminBillingClient";

export default async function AdminBillingPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const pendingPayments = await BillingService.getPendingPayments();

  return <AdminBillingClient pendingPayments={pendingPayments} />;
}