import { Lead, LeadPriority, LeadStatus, MarketId } from "./types";

const SELLER_LABELS: Record<Lead["seller"]["type"], string> = {
  private: "Particular",
  agency: "Agência",
  promoter: "Promotor",
  unknown: "Desconhecido",
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Novo",
  saved: "Guardado",
  contacted: "Contactado",
  visit: "Visita",
  locating: "Localizar",
  not_relevant: "Não relevante",
};

export const PRIORITY_LABELS: Record<LeadPriority, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
  exclude: "Excluído",
};

export const MARKET_LABELS: Record<MarketId, string> = {
  cascais: "Cascais",
  belem_restelo: "Belém/Restelo",
  alges_arredores: "Algés/Miraflores",
};

const MARKET_POSITION_LABELS: Record<string, string> = {
  below_market: "Abaixo do mercado",
  around_market: "Em linha com o mercado",
  above_market: "Acima do mercado",
  unknown: "Sem dados suficientes",
};

/** Sinais que o backend ainda não tenha classificado caem no fallback, nunca num rótulo inventado. */
export function formatMarketPosition(position: string | null | undefined): string {
  if (!position) return "Sem dados suficientes";
  return MARKET_POSITION_LABELS[position] ?? "Sem dados suficientes";
}

const MARKET_CONFIDENCE_LABELS: Record<string, string> = {
  high: "Confiança alta",
  medium: "Confiança média",
  low: "Confiança baixa",
  unknown: "Confiança desconhecida",
};

export function formatMarketConfidence(confidence: string | null | undefined): string {
  if (!confidence) return "Confiança desconhecida";
  return MARKET_CONFIDENCE_LABELS[confidence] ?? "Confiança desconhecida";
}

export const ALL_STATUSES: LeadStatus[] = [
  "new",
  "saved",
  "contacted",
  "visit",
  "locating",
  "not_relevant",
];

export const PIPELINE_STATUSES: Exclude<LeadStatus, "locating">[] = [
  "new",
  "saved",
  "contacted",
  "visit",
  "not_relevant",
];

export const ALL_PRIORITIES: LeadPriority[] = ["high", "medium", "low", "exclude"];

/** Nomes dos mercados presentes nos leads, para usar em texto ("N leads em X"). */
export function marketsSummary(leads: Lead[]): string {
  const present = Array.from(new Set(leads.map((lead) => lead.market)));
  const labels = present.map((market) => MARKET_LABELS[market] ?? market);
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} e ${labels[labels.length - 1]}`;
}

export function sellerDisplayName(seller: Lead["seller"]): string {
  const typeLabel = SELLER_LABELS[seller.type];
  return seller.agency_name ? `${typeLabel} · ${seller.agency_name}` : typeLabel;
}

export function uniqueZones(leads: Lead[]): string[] {
  return Array.from(
    new Set(leads.map((lead) => lead.property.zone).filter((zone): zone is string => !!zone)),
  ).sort();
}

export function uniqueTypologies(leads: Lead[]): string[] {
  return Array.from(
    new Set(
      leads.map((lead) => lead.property.typology).filter((t): t is string => !!t),
    ),
  ).sort();
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function searchLeads(leads: Lead[], query: string): Lead[] {
  const trimmed = query.trim();
  if (!trimmed) return leads;

  if (/^\d+$/.test(trimmed)) {
    const minScore = Number(trimmed);
    return leads.filter((lead) => lead.score >= minScore);
  }

  const needle = normalize(trimmed);
  return leads.filter((lead) => {
    const haystack = normalize(
      [
        lead.id,
        lead.property.zone,
        lead.property.micro_zone,
        lead.property.typology,
        lead.property.title,
        lead.seller.name,
        lead.seller.agency_name,
        lead.manual_notes,
        lead.localization_case?.answer?.formatted_address,
        lead.localization_case?.answer?.explanation,
        ...lead.signals,
      ]
        .filter((part): part is string => !!part)
        .join(" "),
    );
    return haystack.includes(needle);
  });
}

/**
 * Removida: adjacentLeadIds ordenava TODOS os leads por score e ignorava
 * qualquer filtro — era a causa do bug em que as setas ‹ › saltavam de
 * secção. Ver lib/leadQuery.ts#adjacentInQuery, que deriva prev/next da
 * MESMA lista filtrada/ordenada que a tabela mostra.
 */
