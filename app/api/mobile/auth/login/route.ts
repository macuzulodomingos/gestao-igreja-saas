import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signMobileToken } from "@/lib/mobile-auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: "invalid_input" }, { status: 400 });
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        role: true,
        deletedAt: true,
        churchId: true,
        church: { select: { slug: true } },
      },
    });

    // Mesmo padrão de "hash falso" já usado no authorize() web — mantém
    // tempo de resposta consistente entre email existente/inexistente.
    if (!user || !user.password) {
      await bcrypt.compare(
        password,
        "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
      );
      return NextResponse.json({ success: false, error: "invalid_credentials" }, { status: 401 });
    }

    if (user.deletedAt) {
      return NextResponse.json({ success: false, error: "invalid_credentials" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ success: false, error: "invalid_credentials" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && !user.churchId) {
      return NextResponse.json({ success: false, error: "invalid_credentials" }, { status: 401 });
    }

    const token = signMobileToken({
      userId: user.id,
      role: user.role,
      churchId: user.churchId,
      churchSlug: user.church?.slug ?? null,
    });

    return NextResponse.json({ success: true, token });

  } catch (error) {
    console.error("[MOBILE_LOGIN_ERROR]:", error);
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}