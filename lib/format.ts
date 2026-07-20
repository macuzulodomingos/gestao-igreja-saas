export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 0,
  })
    .format(amount)
    .replace(/AOA/g, "Kz")
    .replace(/\s+/g, " ")
    .trim();
}


export function parseCurrencyInput(value: string): number {
  const cleaned = value.trim().replace(/\./g, "").replace(",", ".");
  return Number(cleaned);
}