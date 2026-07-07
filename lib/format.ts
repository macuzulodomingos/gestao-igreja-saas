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