import { Lead } from "../types";
import { MultiAgencyLevel } from "../types/analysis";

/**
 * Fonte única do nível multi-agência de um lead — o facto mostrado
 * (headlineFacts) e o filtro (leadQuery) leem ambos daqui, por isso nunca
 * divergem. Usa `multi_agency_likelihood.level` quando o backend já o
 * calculou; senão deriva da deteção por fotos, lendo as duas formas
 * (`matched_agency` singular e `matched_agencies` plural).
 */

const LEVELS: readonly string[] = ["confirmed", "probable", "unlikely", "unknown"];

/** Agências correspondidas pela deteção, nas duas formas em que o backend as escreve. */
export function matchedAgencies(lead: Lead): string[] {
  const detection = lead.multi_agency_detection;
  if (!detection) return [];
  const plural = (detection.matched_agencies ?? []).filter(Boolean);
  if (plural.length > 0) return plural;
  return detection.matched_agency ? [detection.matched_agency] : [];
}

/**
 * O campo derivado, ou null se for mais antigo que a deteção por fotos: o upsert do
 * backend reescreve `multi_agency_detection` sem recalcular a likelihood, por isso
 * `computed_at` < `checked_at` quer dizer que as fotos foram verificadas depois.
 * Sem as duas datas não há como saber e o campo é aceite.
 */
export function currentLikelihood(lead: Lead): Lead["multi_agency_likelihood"] {
  const likelihood = lead.multi_agency_likelihood;
  if (!likelihood) return null;
  const computed = Date.parse(likelihood.computed_at ?? "");
  const checked = Date.parse(lead.multi_agency_detection?.checked_at ?? "");
  return Number.isNaN(computed) || Number.isNaN(checked) || computed >= checked ? likelihood : null;
}

export function multiAgencyLevel(lead: Lead): MultiAgencyLevel {
  const level = currentLikelihood(lead)?.level;
  if (level && LEVELS.includes(level)) return level as MultiAgencyLevel;

  // Fallback: lead sem o campo (anterior ao backfill), com um nível que não conhecemos
  // ou com o campo mais antigo que a deteção por fotos.
  const detection = lead.multi_agency_detection;
  if (detection?.status === "confirmed" || matchedAgencies(lead).length > 0) return "confirmed";
  if (detection?.different_advertiser_confirmed === true) return "probable";
  return "unknown";
}

/** Valores do filtro na URL (inglês). */
export type MultiAgencyFilter = "confirmed_or_probable" | "confirmed" | "probable" | "unlikely" | "unknown";

export const ALL_MULTI_AGENCY_FILTERS: MultiAgencyFilter[] = [
  "confirmed_or_probable",
  "confirmed",
  "probable",
  "unlikely",
  "unknown",
];

export function matchesMultiAgencyFilter(lead: Lead, filter: MultiAgencyFilter): boolean {
  const level = multiAgencyLevel(lead);
  return filter === "confirmed_or_probable" ? level === "confirmed" || level === "probable" : level === filter;
}
