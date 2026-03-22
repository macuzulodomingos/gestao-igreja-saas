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