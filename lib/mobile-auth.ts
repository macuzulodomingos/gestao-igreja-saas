import jwt from "jsonwebtoken";

const SECRET = process.env.MOBILE_JWT_SECRET!;
const TOKEN_TTL = "30d"; // sessão mobile dura mais que a web, evita re-login constante

export interface MobileTokenPayload {
  userId: string;
  role: string;
  churchId: string | null;
  churchSlug: string | null;
}

export function signMobileToken(payload: MobileTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as MobileTokenPayload;
  } catch (error) {
    return null;
  }
}