import { RecruitmentListItem, RecruitmentPriority, RecruitmentStage, RecruitmentTab, RECRUITMENT_STAGES, recruitmentTabFor } from "./recruitment";

export const ALL_RECRUITMENT = "all";
export type RecruitmentSort = "score" | "name" | "updated" | "recontact";
export type RecruitmentView = "table" | "kanban";

export interface RecruitmentQuery {
  tab: RecruitmentTab;
  q: string;
  stage: RecruitmentStage | typeof ALL_RECRUITMENT;
  segment: string;
  priority: RecruitmentPriority | typeof ALL_RECRUITMENT;
  sort: RecruitmentSort;
  view: RecruitmentView;
}

export function parseRecruitmentQuery(params: Pick<URLSearchParams, "get">): RecruitmentQuery {
  const tab = params.get("tab");
  const stage = params.get("stage");
  const priority = params.get("priority");
  const sort = params.get("sort");
  return {
    tab: tab === "enrichment" || tab === "rejected" ? tab : "outreach",
    q: params.get("q") ?? "",
    stage: stage && RECRUITMENT_STAGES.includes(stage as RecruitmentStage) ? stage as RecruitmentStage : ALL_RECRUITMENT,
    segment: params.get("segment") || ALL_RECRUITMENT,
    priority: priority === "A" || priority === "B" || priority === "C" || priority === "Exclude" ? priority : ALL_RECRUITMENT,
    sort: sort === "name" || sort === "updated" || sort === "recontact" ? sort : "score",
    view: params.get("view") === "kanban" ? "kanban" : "table",
  };
}

export function recruitmentQueryParams(query: RecruitmentQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.tab !== "outreach") params.set("tab", query.tab);
  if (query.q) params.set("q", query.q);
  if (query.stage !== ALL_RECRUITMENT) params.set("stage", query.stage);
  if (query.segment !== ALL_RECRUITMENT) params.set("segment", query.segment);
  if (query.priority !== ALL_RECRUITMENT) params.set("priority", query.priority);
  if (query.sort !== "score") params.set("sort", query.sort);
  if (query.view !== "table") params.set("view", query.view);
  return params;
}

export function recruitmentIndexHref(query: RecruitmentQuery): string {
  const qs = recruitmentQueryParams(query).toString();
  return qs ? `/recrutamento?${qs}` : "/recrutamento";
}

export function recruitmentHref(id: string, query: RecruitmentQuery): string {
  const qs = recruitmentQueryParams(query).toString();
  return qs ? `/recrutamento/${id}?${qs}` : `/recrutamento/${id}`;
}

export function applyRecruitmentQuery(items: RecruitmentListItem[], query: RecruitmentQuery): RecruitmentListItem[] {
  const needle = query.q.trim().toLocaleLowerCase("pt-PT").normalize("NFD").replace(/\p{Diacritic}/gu, "");
  return items.filter((item) => {
    if (recruitmentTabFor(item) !== query.tab) return false;
    if (query.stage !== ALL_RECRUITMENT && item.funnel_stage !== query.stage) return false;
    if (query.segment !== ALL_RECRUITMENT && item.segment !== query.segment) return false;
    if (query.priority !== ALL_RECRUITMENT && item.priority !== query.priority) return false;
    if (!needle) return true;
    return [item.full_name, item.email, item.professional_role, item.current_affiliation, item.geographic_area, item.segment]
      .filter(Boolean).join(" ").toLocaleLowerCase("pt-PT").normalize("NFD").replace(/\p{Diacritic}/gu, "").includes(needle);
  }).sort((a, b) => {
    if (query.sort === "name") return a.full_name.localeCompare(b.full_name, "pt-PT");
    if (query.sort === "updated") return b.updated_at.localeCompare(a.updated_at);
    if (query.sort === "recontact") return (a.recontact_at ?? "9999").localeCompare(b.recontact_at ?? "9999");
    return b.score_total - a.score_total || a.full_name.localeCompare(b.full_name, "pt-PT");
  });
}

export function recruitmentParamsFromRecord(record: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) params.set(key, Array.isArray(value) ? value[0] ?? "" : value);
  }
  return params;
}
