import { format } from "date-fns";
import { ptBR, fr } from "date-fns/locale";

export const dateLocalesMap = { pt: ptBR, fr: fr };

/**
 * Resolve o locale do date-fns a partir do locale do next-intl,
 * com fallback para pt-BR. Centraliza o mesmo mapa usado em vários
 * componentes (Billing, Finance) que hoje redefinem isto localmente.
 */
export function resolveDateLocale(locale: string) {
  return dateLocalesMap[locale as keyof typeof dateLocalesMap] ?? ptBR;
}

/**
 * Nome do mês, capitalizado, no locale informado.
 * Ex: formatMonthName(new Date(2026, 2, 1), "fr") -> "Mars"
 *     formatMonthName(new Date(2026, 2, 1), "pt") -> "Março"
 */
export function formatMonthName(date: Date, locale: string): string {
  const dateLocale = resolveDateLocale(locale);
  const monthName = format(date, "MMMM", { locale: dateLocale });
  return monthName.charAt(0).toUpperCase() + monthName.slice(1);
}

/**
 * Lista com os 12 nomes de mês do ano, capitalizados, no locale informado.
 * Útil para popular selects de mês (ex: FinanceClientPage).
 */
export function getMonthNames(locale: string): string[] {
  const dateLocale = resolveDateLocale(locale);
  return Array.from({ length: 12 }, (_, i) => {
    const monthName = format(new Date(2000, i, 1), "MMMM", { locale: dateLocale });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  });
}