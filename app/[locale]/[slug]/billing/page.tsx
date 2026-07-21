import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { BillingService, PRICES } from "@/services/billingService";
import { BillingClient } from "@/components/Billing/BillingClient";
import { getChurchBySlug } from "@/lib/tenant";


interface BillingPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export default async function BillingPage({ params }: BillingPageProps) {
  const session = await auth();
  const { slug, locale } = await params;

  if (!session?.user) {
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

 
  const subscription = await BillingService.getSubscription(churchId);

  return (
    <BillingClient
      currentPlan={church.plan}
      subscription={subscription}
      prices={PRICES}
      churchName={church.name}
      churchId={churchId}
    />
  );
}