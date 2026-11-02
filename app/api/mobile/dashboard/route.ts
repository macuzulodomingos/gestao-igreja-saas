// app/api/mobile/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireMobileAuth } from "@/lib/mobile-auth-guard";
import { DashboardService } from "@/services/dashboardService";

export async function GET(req: NextRequest) {
  const auth = requireMobileAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (!auth.churchId) {
    return NextResponse.json({ success: false, error: "no_church" }, { status: 400 });
  }

  try {
    const [stats, recentMembers, recentTransactions] = await Promise.all([
      DashboardService.getChurchStats(auth.churchId),
      DashboardService.getRecentMembers(auth.churchId),
      DashboardService.getRecentTransactions(auth.churchId),
    ]);

    return NextResponse.json({ success: true, stats, recentMembers, recentTransactions });

  } catch (error) {
    console.error("[MOBILE_DASHBOARD_ERROR]:", error);
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}