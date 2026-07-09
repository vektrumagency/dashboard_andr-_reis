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

/** Espera uma fração (-0.1862), não uma percentagem já multiplicada. */
export function formatSignedPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-PT", {
    style: "percent",
    signDisplay: "exceptZero",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatSignedEuroPerSqm(value: number | null | undefined): string {
  if (value == null) return "—";
  return (
    new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      signDisplay: "exceptZero",
      maximumFractionDigits: 0,
    }).format(value) + "/m²"
  );
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
