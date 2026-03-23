import { fromZonedTime } from "date-fns-tz";

export function centsToAmount(value: unknown): number {
  if (value == null) return 0;
  return Number(BigInt(Math.round(Number(value)))) / 100;
}

export function amountToCents(amount: number | string): bigint {
  const parsed = typeof amount === "string"
    ? parseFloat(amount.replace(/\./g, "").replace(",", "."))
    : amount;
  if (isNaN(parsed)) return BigInt(0);
  return BigInt(Math.round(parsed * 100));
}


export function getMonthRangeInTimezone(year: number, month: number, timezone: string) {
  // 👈 usa strings ISO para evitar interpretação do timezone da máquina
  const startOfMonth = fromZonedTime(
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00`,
    timezone
  );

  // último dia do mês
  const lastDay = new Date(year, month, 0).getDate();
  const endOfMonth = fromZonedTime(
    `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}T23:59:59.999`,
    timezone
  );

  return { startOfMonth, endOfMonth };
}


