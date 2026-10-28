import { describe, expect, it } from "vitest";
import { RecruitmentListItem, RECRUITMENT_STAGES, recruitmentTabFor } from "./recruitment";
import { applyRecruitmentQuery, parseRecruitmentQuery, recruitmentIndexHref } from "./recruitmentQuery";

function candidate(id: string, overrides: Partial<RecruitmentListItem> = {}): RecruitmentListItem {
  return {
    id, full_name: `Pessoa ${id}`, email: null, linkedin_url: null,
    professional_role: null, current_affiliation: null, geographic_area: null,
    segment: "experienced_consultant", status: "qualified", priority: "A",
    score_total: 80, lead_completeness: "complete", missing_fields: [], email_origin: null,
    funnel_stage: "new", stage_updated_at: null, stage_note: null, recontact_at: null,
    updated_at: "2026-10-28T12:00:00.000Z", ...overrides,
  };
}

describe("recruitment views", () => {
  const items = [
    candidate("ready"),
    candidate("waiting", { lead_completeness: "needs_enrichment", missing_fields: ["email"] }),
    candidate("rejected", { status: "rejected", priority: "C" }),
    candidate("opted", { funnel_stage: "opted_out" }),
  ];

  it("keeps research outcomes separate from funnel stages", () => {
    expect(RECRUITMENT_STAGES).toHaveLength(11);
    expect(items.map(recruitmentTabFor)).toEqual(["outreach", "enrichment", "rejected", "outreach"]);
    expect(applyRecruitmentQuery(items, parseRecruitmentQuery(new URLSearchParams())).map((item) => item.id)).toEqual(["opted", "ready"]);
    expect(applyRecruitmentQuery(items, parseRecruitmentQuery(new URLSearchParams("tab=enrichment"))).map((item) => item.id)).toEqual(["waiting"]);
    expect(applyRecruitmentQuery(items, parseRecruitmentQuery(new URLSearchParams("tab=rejected"))).map((item) => item.id)).toEqual(["rejected"]);
  });

  it("preserves stage filters in links and rejects invalid query values", () => {
    const query = parseRecruitmentQuery(new URLSearchParams("stage=opted_out&segment=experienced_consultant&view=kanban"));
    expect(applyRecruitmentQuery(items, query).map((item) => item.id)).toEqual(["opted"]);
    expect(recruitmentIndexHref(query)).toContain("stage=opted_out");
    expect(parseRecruitmentQuery(new URLSearchParams("tab=unknown&stage=wrong")).stage).toBe("all");
  });
});
