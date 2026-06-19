export function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatArea(sqm: number): string {
  return `${sqm} m²`;
}

export function priceDropPercent(current: number, initial: number): number {
  if (initial <= 0 || current >= initial) return 0;
  return Math.round(((initial - current) / initial) * 100);
}
