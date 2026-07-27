import { Lead, LeadPriority, LeadStatus } from "./types";
import { ALL_PRIORITIES, ALL_STATUSES, searchLeads, uniqueTypologies, uniqueZones } from "./leads";

/**
 * Fonte única da ordenação/filtragem "visível" — a tabela e a navegação
 * ‹ › do detalhe leem daqui em vez de terem cada uma a sua própria lógica.
 *
 * Antes disto, os filtros da tabela viviam em useState (LeadsTable) e o
 * estado nunca chegava à rota /leads/[id] — daí as setas saltarem de
 * secção (ver adjacentLeadIds, removido de lib/leads.ts). Agora tudo vive
 * na URL: a tabela lê/escreve searchParams, e a rota de detalhe recebe os
 * mesmos searchParams e deriva prev/next da EXACTA lista que o utilizador
 * estava a ver.
 */

export const ALL = "Todas";

export type SortKey = "score" | "price" | "price_per_sqm" | "price_vs_market" | "area";

export const SORT_LABELS: Record<SortKey, string> = {
  score: "Score",
  price: "Preço",
  price_per_sqm: "€/m²",
  price_vs_market: "% vs mercado",
  area: "Área",
};

export const ALL_SORT_KEYS: SortKey[] = ["score", "price", "price_per_sqm", "price_vs_market", "area"];

export type SortDir = "asc" | "desc";

export interface LeadQuery {
  q: string;
  status: LeadStatus | typeof ALL;
  zone: string;
  priority: LeadPriority | typeof ALL;
  typology: string;
  sort: SortKey;
  dir: SortDir;
}

const DEFAULT_QUERY: LeadQuery = {
  q: "",
  status: "new",
  zone: ALL,
  priority: ALL,
  typology: ALL,
  sort: "score",
  dir: "desc",
};

type ParamSource = URLSearchParams | Pick<URLSearchParams, "get">;

export function parseLeadQuery(params: ParamSource): LeadQuery {
  const status = params.get("status");
  const priority = params.get("priority");
  const sort = params.get("sort");
  const dir = params.get("dir");

  return {
    q: params.get("q") ?? DEFAULT_QUERY.q,
    status:
      status === ALL || (status && ALL_STATUSES.includes(status as LeadStatus))
        ? (status as LeadStatus | typeof ALL)
        : DEFAULT_QUERY.status,
    zone: params.get("zone") ?? DEFAULT_QUERY.zone,
    priority:
      priority === ALL || (priority && ALL_PRIORITIES.includes(priority as LeadPriority))
        ? (priority as LeadPriority | typeof ALL)
        : DEFAULT_QUERY.priority,
    typology: params.get("typology") ?? DEFAULT_QUERY.typology,
    sort: sort && ALL_SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : DEFAULT_QUERY.sort,
    dir: dir === "asc" ? "asc" : DEFAULT_QUERY.dir,
  };
}

/** Só inclui na querystring o que se desvia do default — URLs curtas e legíveis. */
export function leadQueryToSearchParams(query: LeadQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status !== DEFAULT_QUERY.status) params.set("status", query.status);
  if (query.zone !== ALL) params.set("zone", query.zone);
  if (query.priority !== ALL) params.set("priority", query.priority);
  if (query.typology !== ALL) params.set("typology", query.typology);
  if (query.sort !== DEFAULT_QUERY.sort) params.set("sort", query.sort);
  if (query.dir !== DEFAULT_QUERY.dir) params.set("dir", query.dir);
  return params;
}

function sortValue(lead: Lead, sort: SortKey): number {
  switch (sort) {
    case "score":
      return lead.score;
    case "price":
      return lead.property.price_current ?? -Infinity;
    case "price_per_sqm":
      return lead.property.price_per_sqm ?? -Infinity;
    case "price_vs_market":
      return lead.property.price_vs_market_pct ?? -Infinity;
    case "area":
      return lead.property.area_sqm ?? -Infinity;
  }
}

export function applyLeadQuery(leads: Lead[], query: LeadQuery): Lead[] {
  const filtered = searchLeads(leads, query.q)
    .filter((lead) => query.zone === ALL || lead.property.zone === query.zone)
    .filter((lead) => query.priority === ALL || lead.priority === query.priority)
    .filter((lead) => query.status === ALL || lead.status === query.status)
    .filter((lead) => query.typology === ALL || lead.property.typology === query.typology);

  const sign = query.dir === "asc" ? 1 : -1;
  return [...filtered].sort((a, b) => sign * (sortValue(a, query.sort) - sortValue(b, query.sort)));
}

export interface AdjacentResult {
  prevId: string | null;
  nextId: string | null;
  /** 1-based, para mostrar "3 de 10"; -1 quando o lead actual já não está na lista filtrada. */
  index: number;
  total: number;
}

/**
 * Substitui adjacentLeadIds — em vez de ordenar TODOS os leads por score,
 * aplica a mesma query (filtros + ordenação) que a tabela está a mostrar,
 * e anda ±1 dentro dessa lista. É o que garante que as setas nunca saem
 * da secção/filtro em que o utilizador estava.
 */
export function adjacentInQuery(leads: Lead[], query: LeadQuery, currentId: string): AdjacentResult {
  const filtered = applyLeadQuery(leads, query);
  const total = filtered.length;
  const index = filtered.findIndex((lead) => lead.id === currentId);
  if (index === -1) {
    return { prevId: null, nextId: null, index: -1, total };
  }
  return {
    prevId: index > 0 ? filtered[index - 1].id : null,
    nextId: index < total - 1 ? filtered[index + 1].id : null,
    index: index + 1,
    total,
  };
}

/**
 * As rotas de detalhe do App Router recebem `searchParams` como um objecto
 * simples (`Record<string, string | string[] | undefined>`), não como
 * `URLSearchParams` — este helper cobre essa forma para poder reutilizar
 * `parseLeadQuery` nos dois sítios.
 */
export function searchParamsFromRecord(
  record: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (value == null) continue;
    params.set(key, Array.isArray(value) ? (value[0] ?? "") : value);
  }
  return params;
}

/** Constrói "/leads/{id}?{query}", omitindo o "?" quando a query está vazia. */
export function leadHref(id: string, query: LeadQuery): string {
  const qs = leadQueryToSearchParams(query).toString();
  return qs ? `/leads/${id}?${qs}` : `/leads/${id}`;
}

/** Constrói "/?{query}" para o link de regresso à tabela. */
export function leadsIndexHref(query: LeadQuery): string {
  const qs = leadQueryToSearchParams(query).toString();
  return qs ? `/?${qs}` : "/";
}

export { uniqueZones, uniqueTypologies };
