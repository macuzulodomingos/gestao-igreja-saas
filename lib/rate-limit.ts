import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Limite por IP: no máximo 5 pedidos de reset de senha a cada 10 minutos,
// vindos do mesmo IP — protege contra alguém testando vários emails em
// sequência a partir do mesmo lugar.
export const passwordResetIpLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: "ratelimit:password-reset:ip",
  analytics: true,
});

// Limite por e-mail: no máximo 3 pedidos de reset a cada 15 minutos, para
// o mesmo endereço — protege contra spam repetido para uma única vítima
// (mesmo que venha de IPs diferentes).
export const passwordResetEmailLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "15 m"),
  prefix: "ratelimit:password-reset:email",
  analytics: true,
});