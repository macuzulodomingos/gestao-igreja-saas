import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BillingService, PRICES } from "@/services/billingService";
import { BillingClient } from "@/components/Billing/BillingClient";
import prisma from "@/lib/prisma";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.churchId) redirect("/login");

  const { churchId } = session.user;

  const [church, subscription] = await Promise.all([
    prisma.church.findUnique({
      where: { id: churchId },
      select: { name: true, plan: true },
    }),
    BillingService.getSubscription(churchId),
  ]);

  if (!church) redirect("/login");

  return (
    <BillingClient
      currentPlan={church.plan}
      subscription={subscription}
      prices={PRICES}
      churchName={church.name}
    />
  );
}