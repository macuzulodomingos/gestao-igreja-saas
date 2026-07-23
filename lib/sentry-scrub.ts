import type { ErrorEvent, EventHint } from "@sentry/nextjs";

/**
 * Remove o corpo da requisição e cookies de todo evento antes de enviar
 * ao Sentry. Isso é a prática padrão para qualquer app que lida com dados
 * de utilizador (senhas, dados financeiros, informação pessoal de
 * membros) — o valor real de debug do Sentry está no stack trace, não
 * no payload. Se for necessário investigar o payload exato de um erro,
 * os logs do servidor (console.error, já presentes em todas as Server
 * Actions do projeto) continuam disponíveis para isso.
 */
export function scrubSensitiveData(event: ErrorEvent, _hint: EventHint): ErrorEvent {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;

    if (event.request.headers) {
      for (const key of Object.keys(event.request.headers)) {
        const lower = key.toLowerCase();
        if (lower === "authorization" || lower === "cookie") {
          delete event.request.headers[key];
        }
      }
    }
  }
  return event;
}