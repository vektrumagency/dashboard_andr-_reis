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

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays <= 0) return "hoje";
  if (diffDays === 1) return "há 1 dia";
  if (diffDays < 30) return `há ${diffDays} dias`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "há 1 mês";
  if (diffMonths < 12) return `há ${diffMonths} meses`;
  const diffYears = Math.floor(diffMonths / 12);
  return diffYears === 1 ? "há 1 ano" : `há ${diffYears} anos`;
}
