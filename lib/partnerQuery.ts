import { PartnerListItem, PartnerPriority, PartnerStage, PARTNER_STAGES } from "./partners";

export const ALL_PARTNERS = "all";
export type PartnerSort = "score" | "company" | "updated";
export type PartnerView = "table" | "kanban";

export interface PartnerQuery {
  q: string;
  stage: PartnerStage | typeof ALL_PARTNERS;
  segment: string;
  priority: PartnerPriority | typeof ALL_PARTNERS;
  sort: PartnerSort;
  dir: "asc" | "desc";
  view: PartnerView;
}

export const DEFAULT_PARTNER_QUERY: PartnerQuery = {
  q: "", stage: ALL_PARTNERS, segment: ALL_PARTNERS, priority: ALL_PARTNERS,
  sort: "score", dir: "desc", view: "table",
};

export function parsePartnerQuery(params: Pick<URLSearchParams, "get">): PartnerQuery {
  const stage = params.get("stage");
  const priority = params.get("priority");
  const sort = params.get("sort");
  return {
    q: params.get("q") ?? "",
    stage: stage && PARTNER_STAGES.includes(stage as PartnerStage) ? stage as PartnerStage : ALL_PARTNERS,
    segment: params.get("segment") || ALL_PARTNERS,
    priority: priority === "A" || priority === "B" || priority === "C" || priority === "Exclude" ? priority : ALL_PARTNERS,
    sort: sort === "company" || sort === "updated" ? sort : "score",
    dir: params.get("dir") === "asc" ? "asc" : "desc",
    view: params.get("view") === "kanban" ? "kanban" : "table",
  };
}

export function partnerQueryParams(query: PartnerQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.stage !== ALL_PARTNERS) params.set("stage", query.stage);
  if (query.segment !== ALL_PARTNERS) params.set("segment", query.segment);
  if (query.priority !== ALL_PARTNERS) params.set("priority", query.priority);
  if (query.sort !== "score") params.set("sort", query.sort);
  if (query.dir !== "desc") params.set("dir", query.dir);
  if (query.view !== "table") params.set("view", query.view);
  return params;
}

export function partnerIndexHref(query: PartnerQuery): string {
  const qs = partnerQueryParams(query).toString();
  return qs ? `/parceiros?${qs}` : "/parceiros";
}

export function partnerHref(id: string, query: PartnerQuery): string {
  const qs = partnerQueryParams(query).toString();
  return qs ? `/parceiros/${id}?${qs}` : `/parceiros/${id}`;
}

export function applyPartnerQuery(partners: PartnerListItem[], query: PartnerQuery): PartnerListItem[] {
  const needle = query.q.trim().toLocaleLowerCase("pt-PT").normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const filtered = partners.filter((partner) => {
    if (query.stage !== ALL_PARTNERS && partner.funnel_stage !== query.stage) return false;
    if (query.segment !== ALL_PARTNERS && partner.segment !== query.segment) return false;
    if (query.priority !== ALL_PARTNERS && partner.priority !== query.priority) return false;
    if (!needle) return true;
    const haystack = [partner.company_name, partner.company_domain, partner.segment, partner.contact.name,
      partner.contact.role, partner.contact.business_email, partner.contact.telephone]
      .filter(Boolean).join(" ").toLocaleLowerCase("pt-PT").normalize("NFD").replace(/\p{Diacritic}/gu, "");
    return haystack.includes(needle);
  });
  const sign = query.dir === "asc" ? 1 : -1;
  return [...filtered].sort((a, b) => {
    const comparison = query.sort === "company"
      ? a.company_name.localeCompare(b.company_name, "pt-PT")
      : query.sort === "updated"
        ? a.updated_at.localeCompare(b.updated_at)
        : a.score_total - b.score_total;
    return sign * comparison || a.company_name.localeCompare(b.company_name, "pt-PT");
  });
}

export function partnerAdjacency(partners: PartnerListItem[], query: PartnerQuery, id: string) {
  const visible = applyPartnerQuery(partners, query);
  const index = visible.findIndex((partner) => partner.id === id);
  return {
    prevId: index > 0 ? visible[index - 1].id : null,
    nextId: index >= 0 && index < visible.length - 1 ? visible[index + 1].id : null,
    index: index < 0 ? -1 : index + 1,
    total: visible.length,
  };
}

export function partnerParamsFromRecord(record: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) params.set(key, Array.isArray(value) ? value[0] ?? "" : value);
  }
  return params;
}
