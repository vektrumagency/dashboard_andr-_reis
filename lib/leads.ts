import { ActiveMarketId, Lead, LeadPriority, LeadStatus, MarketId } from "./types";
import { MARKET_ZONES, activeMarketOf } from "./zones";

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
  lisboa: "Lisboa",
  cascais: "Cascais",
  oeiras: "Oeiras",
  amadora: "Amadora",
  // Históricos — os leads antigos destes mercados aparecem dentro de Lisboa e Oeiras.
  belem_restelo: "Belém/Restelo (histórico)",
  alges_arredores: "Algés/Miraflores (histórico)",
};

/** Nome do mercado para um id que o backend possa ter escrito e que ainda não conhecemos. */
export function marketLabel(market: string | null | undefined): string {
  if (!market) return "Mercado por confirmar";
  return MARKET_LABELS[market as MarketId] ?? market;
}

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

/**
 * Nomes dos mercados presentes nos leads, para usar em texto ("N leads em X").
 * Leads históricos contam para o mercado activo que os absorveu, para o
 * texto não dizer "Lisboa e Belém/Restelo".
 */
export function marketsSummary(leads: Lead[]): string {
  const present = Array.from(new Set(leads.map((lead) => activeMarketOf(lead.market) ?? lead.market)));
  const labels = present.map((market) => marketLabel(market));
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

/**
 * Zonas para o filtro quando há um mercado escolhido: as zonas conhecidas
 * desse mercado que têm leads, mais qualquer outra zona que os leads desse
 * mercado tragam. Sem mercado (ALL), devolve todas as zonas presentes.
 */
export function zonesForMarket(leads: Lead[], market: ActiveMarketId | null): string[] {
  if (!market) return uniqueZones(leads);
  const inMarket = leads.filter((lead) => activeMarketOf(lead.market) === market);
  const present = new Set(uniqueZones(inMarket));
  const known = MARKET_ZONES[market].filter((zone) => present.has(zone));
  const extra = Array.from(present).filter((zone) => !known.includes(zone)).sort();
  return [...known, ...extra];
}

export interface MultiAgencyInfo {
  /** Agências distintas que anunciam o imóvel, incluindo a do próprio anúncio. */
  agencies: string[];
  /** Número de agências — pode ser maior que `agencies.length` quando o backend só dá a contagem. */
  agencyCount: number;
  /** Número de anúncios do mesmo imóvel (este incluído). */
  listingCount: number;
}

/**
 * Lead multi-agência confirmado: o mesmo imóvel anunciado por 2+ agências.
 * Fonte principal: `multi_agency_detection.status === "confirmed"`. Também
 * aceita os campos de cluster (`cluster_kind`, `property_cluster`), que o
 * backend está a introduzir. Devolve null para tudo o que não é confirmado
 * — "provável" ou "sem indícios" nunca contam para o filtro nem para a ordem.
 */
export function multiAgencyInfo(lead: Lead): MultiAgencyInfo | null {
  const detection = lead.multi_agency_detection;
  const cluster = lead.property_cluster;
  const confirmed =
    detection?.status === "confirmed" ||
    detection?.cluster_kind === "multi_agency" ||
    cluster?.kind === "multi_agency";
  if (!confirmed) return null;

  const names = [
    lead.seller.type === "agency" ? lead.seller.agency_name : null,
    ...(detection?.matched_agencies ?? []),
    ...(cluster?.agencies ?? []),
  ];
  const seen = new Set<string>();
  const agencies: string[] = [];
  for (const name of names) {
    const trimmed = name?.trim();
    if (!trimmed) continue;
    const key = normalize(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    agencies.push(trimmed);
  }

  return {
    agencies,
    agencyCount: Math.max(
      agencies.length,
      detection?.cluster_advertiser_count ?? 0,
      cluster?.advertiser_count ?? 0,
      // Confirmado = 2+ anunciantes distintos. Se este anúncio é de uma agência
      // sem nome conhecido, ainda assim são pelo menos 2 agências; se é de um
      // particular, só contamos as agências que conhecemos.
      lead.seller.type === "private" ? 1 : 2,
    ),
    listingCount: Math.max(
      // Os matched_listing_ids são os OUTROS anúncios; +1 para este.
      detection?.matched_listing_ids?.length ? detection.matched_listing_ids.length + 1 : 0,
      cluster?.listing_ids?.length ?? 0,
      detection?.cluster_listing_count ?? 0,
      cluster?.listing_count ?? 0,
      2,
    ),
  };
}

export function isMultiAgency(lead: Lead): boolean {
  return multiAgencyInfo(lead) !== null;
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
