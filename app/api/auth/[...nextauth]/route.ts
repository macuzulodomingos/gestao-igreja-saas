// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth"; // Onde você configurou o NextAuth
export const { GET, POST } = handlers;