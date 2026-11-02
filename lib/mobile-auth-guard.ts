import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken, type MobileTokenPayload } from "@/lib/mobile-auth";

/**
 * Extrai e valida o token JWT do header Authorization de uma requisição
 * mobile. Retorna o payload decodificado se válido, ou uma resposta de
 * erro pronta para devolver (401) se inválido/ausente.
 *
 * Uso em cada rota protegida:
 *   const auth = requireMobileAuth(req);
 *   if (auth instanceof NextResponse) return auth; // token inválido, devolve o erro
 *   const { userId, role, churchId } = auth; // token válido, segue com os dados
 */
export function requireMobileAuth(req: NextRequest): MobileTokenPayload | NextResponse {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const payload = verifyMobileToken(token);

  if (!payload) {
    return NextResponse.json({ success: false, error: "invalid_token" }, { status: 401 });
  }

  return payload;
}