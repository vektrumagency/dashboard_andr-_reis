import { describe, expect, it } from "vitest";
import { PARTNER_STAGES, PARTNER_STAGE_LABELS, PartnerListItem } from "./partners";
import { applyPartnerQuery, DEFAULT_PARTNER_QUERY, parsePartnerQuery, partnerAdjacency, partnerIndexHref, partnerQueryParams } from "./partnerQuery";

function partner(id: string, overrides: Partial<PartnerListItem> = {}): PartnerListItem {
  return {
    id, company_name: `Empresa ${id}`, segment: "mortgage_credit", status: "qualified",
    priority: "B", score_total: 60, funnel_stage: "new", contact: {}, updated_at: "2026-10-07T00:00:00.000Z",
    ...overrides,
  };
}

describe("partner funnel", () => {
  it("has six saved stages and displays existing new records as Lead", () => {
    expect(PARTNER_STAGES).toEqual(["new", "contacted", "engaged", "closed_won", "closed_lost", "closed_on_hold"]);
    expect(PARTNER_STAGE_LABELS.new).toBe("Lead");
  });

  it("round-trips table and Kanban query state", () => {
    const query = { ...DEFAULT_PARTNER_QUERY, q: "cascais", stage: "engaged" as const,
      segment: "mortgage_credit", priority: "B" as const, sort: "company" as const,
      dir: "asc" as const, view: "kanban" as const };
    expect(parsePartnerQuery(partnerQueryParams(query))).toEqual(query);
    expect(partnerIndexHref(query)).toContain("view=kanban");
    expect(parsePartnerQuery(new URLSearchParams("stage=invalid&view=wrong")).stage).toBe("all");
  });

  it("filters and sorts the same list used by adjacent detail navigation", () => {
    const items = [
      partner("one", { company_name: "Água", score_total: 80, funnel_stage: "new" }),
      partner("two", { company_name: "Beta", score_total: 75, funnel_stage: "engaged" }),
      partner("three", { company_name: "Alfa", score_total: 55, funnel_stage: "engaged" }),
    ];
    const query = { ...DEFAULT_PARTNER_QUERY, stage: "engaged" as const, sort: "company" as const, dir: "asc" as const };
    expect(applyPartnerQuery(items, query).map((item) => item.id)).toEqual(["three", "two"]);
    expect(partnerAdjacency(items, query, "three")).toEqual({ prevId: null, nextId: "two", index: 1, total: 2 });
    expect(applyPartnerQuery(items, { ...DEFAULT_PARTNER_QUERY, q: "agua" }).map((item) => item.id)).toEqual(["one"]);
  });
});
