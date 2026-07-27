/**
 * Rótulos pt-PT para os vocabulários "enum-like" da camada de análise.
 * Todos os mapas têm fallback explícito — um valor desconhecido do backend
 * nunca deve aparecer em bruto (em inglês, com underscores) na UI, mas
 * também nunca deve ser escondido: mostra-se com um rótulo genérico
 * assinalado, para dar sinal de que o dicionário precisa de ser alargado.
 */

function labelOf<T extends string>(
  map: Record<T, string>,
  value: string | null | undefined,
  fallbackPrefix: string,
): string | null {
  if (!value) return null;
  return (map as Record<string, string>)[value] ?? `${fallbackPrefix}: ${value}`;
}

const FURNITURE_STATUS_LABELS = {
  furnished: "Mobilada",
  empty: "Vazia",
  partially_furnished: "Parcialmente mobilada",
  unclear: "Não é possível confirmar",
} as const;

export function furnitureStatusLabel(value: string | null | undefined): string | null {
  return labelOf(FURNITURE_STATUS_LABELS, value, "Mobília");
}

const OCCUPANCY_LABELS = {
  lived_in: "Indícios de habitação",
  vacant: "Devoluta",
  staged: "Preparada para venda (home staging)",
  unclear: "Não é possível confirmar",
} as const;

export function occupancyLabel(value: string | null | undefined): string | null {
  return labelOf(OCCUPANCY_LABELS, value, "Ocupação");
}

const CONDITION_LABELS = {
  excellent: "Excelente",
  good: "Boa",
  fair: "Razoável",
  poor: "Degradada",
  unclear: "Não é possível confirmar",
} as const;

export function conditionLabel(value: string | null | undefined): string | null {
  return labelOf(CONDITION_LABELS, value, "Condição");
}

const LUXURY_TIER_LABELS = {
  luxury: "Luxo",
  premium: "Premium",
  standard: "Padrão",
} as const;

export function luxuryTierLabel(value: string | null | undefined): string | null {
  return labelOf(LUXURY_TIER_LABELS, value, "Segmento");
}

const MULTI_AGENCY_STATUS_LABELS = {
  insufficient_evidence: "Evidência insuficiente",
  skipped: "Não verificado",
  confirmed: "Confirmado",
  no_match: "Sem correspondência",
} as const;

export function multiAgencyStatusLabel(value: string | null | undefined): string | null {
  return labelOf(MULTI_AGENCY_STATUS_LABELS, value, "Estado");
}

const MULTI_AGENCY_REASON_LABELS = {
  weak_candidate: "Candidato fraco a correspondência",
  hard_conflict: "Conflito de dados entre anúncios",
} as const;

export function multiAgencyReasonLabel(value: string | null | undefined): string | null {
  return labelOf(MULTI_AGENCY_REASON_LABELS, value, "Motivo");
}

const PRICE_BAND_POSITION_LABELS = {
  within_band: "Dentro da banda",
  below_band: "Abaixo da banda",
  above_band: "Acima da banda",
} as const;

export function priceBandPositionLabel(value: string | null | undefined): string | null {
  return labelOf(PRICE_BAND_POSITION_LABELS, value, "Posição");
}

const CONFIDENCE_LABELS = {
  high: "Confiança alta",
  medium: "Confiança média",
  low: "Confiança baixa",
  unknown: "Confiança desconhecida",
} as const;

export function confidenceLabel(value: string | null | undefined): string | null {
  return labelOf(CONFIDENCE_LABELS, value, "Confiança");
}

const LAYOUT_EFFICIENCY_LABELS = {
  good: "Boa distribuição",
  average: "Distribuição média",
  poor: "Distribuição fraca",
} as const;

export function layoutEfficiencyLabel(value: string | null | undefined): string | null {
  return labelOf(LAYOUT_EFFICIENCY_LABELS, value, "Eficiência");
}

const IMPORTANCE_LABELS = {
  high: "Importância alta",
  medium: "Importância média",
  low: "Importância baixa",
  unknown: "Importância desconhecida",
} as const;

export function importanceLabel(value: string | null | undefined): string | null {
  return labelOf(IMPORTANCE_LABELS, value, "Importância");
}

const IMAGE_ORIGIN_LABELS = {
  photograph: "Fotografia",
  render: "Render / visualização",
} as const;

export function imageOriginLabel(value: string | null | undefined): string | null {
  return labelOf(IMAGE_ORIGIN_LABELS, value, "Origem");
}
