export function formatPrice(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatArea(sqm: number | null): string {
  if (sqm == null) return "—";
  return `${sqm} m²`;
}

export function formatPricePerSqm(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value) + "/m²";
}
