// app/api/mobile/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireMobileAuth } from "@/lib/mobile-auth-guard";
import { MemberService } from "@/services/memberService";

export async function GET(req: NextRequest) {
  const auth = requireMobileAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (!auth.churchId) {
    return NextResponse.json({ success: false, error: "no_church" }, { status: 400 });
  }

  const searchParams = req.nextUrl.searchParams;
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";

  try {
    const result = await MemberService.getMembersByChurch(auth.churchId, page, 20, search);

    return NextResponse.json({
      success: true,
      members: result.members,
      metadata: result.metadata,
    });

  } catch (error) {
    console.error("[MOBILE_MEMBERS_ERROR]:", error);
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}