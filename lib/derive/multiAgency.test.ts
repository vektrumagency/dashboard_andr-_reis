import { describe, expect, it } from "vitest";
import { matchedAgencies, multiAgencyLevel } from "./multiAgency";
import { applyLeadQuery, ALL, LeadQuery } from "../leadQuery";
import { Lead } from "../types";

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "1",
    market: "cascais",
    source: "idealista",
    status: "new",
    priority: "low",
    score: 4,
    property: { zone: "Cascais", images: [] } as unknown as Lead["property"],
    seller: { type: "agency", name: null, agency_name: null, phone: null, email: null, contact_source: null },
    signals: [],
    ai_note: {} as Lead["ai_note"],
    manual_notes: null,
    price_history: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("multiAgencyLevel", () => {
  it("usa o nível do campo derivado quando existe", () => {
    expect(multiAgencyLevel(lead({ multi_agency_likelihood: { level: "unlikely" } }))).toBe("unlikely");
  });

  it("uma regra de agência nunca produz confirmed", () => {
    const l = lead({
      multi_agency_likelihood: {
        level: "probable",
        reasons: [{ source: "agency_rule", code: "agency_non_exclusive", detail: "ERA" }],
      },
    });
    expect(multiAgencyLevel(l)).toBe("probable");
    // Sem nível, as razões de regra não contam para o fallback.
    const noLevel = lead({
      multi_agency_likelihood: { reasons: [{ source: "agency_rule", code: "agency_non_exclusive" }] },
    });
    expect(multiAgencyLevel(noLevel)).toBe("unknown");
  });

  it("nível desconhecido do backend cai no fallback da deteção", () => {
    const l = lead({
      multi_agency_likelihood: { level: "novo" },
      multi_agency_detection: { status: "confirmed", matched_agencies: ["A"] },
    });
    expect(multiAgencyLevel(l)).toBe("confirmed");
  });

  it("likelihood mais antiga que a deteção recalcula pelo fallback; mais recente ou sem datas é aceite", () => {
    const detection = { status: "confirmed", matched_agencies: ["A"], checked_at: "2026-11-02T00:00:00Z" };
    const old = lead({
      multi_agency_likelihood: { level: "probable", computed_at: "2026-11-01T00:00:00Z" },
      multi_agency_detection: detection,
    });
    expect(multiAgencyLevel(old)).toBe("confirmed");
    const fresh = lead({
      multi_agency_likelihood: { level: "probable", computed_at: "2026-11-03T00:00:00Z" },
      multi_agency_detection: detection,
    });
    expect(multiAgencyLevel(fresh)).toBe("probable");
    const undated = lead({ multi_agency_likelihood: { level: "probable" }, multi_agency_detection: detection });
    expect(multiAgencyLevel(undated)).toBe("probable");
  });

  it("lê matched_agency e matched_agencies", () => {
    expect(matchedAgencies(lead({ multi_agency_detection: { matched_agency: "A" } }))).toEqual(["A"]);
    expect(matchedAgencies(lead({ multi_agency_detection: { matched_agencies: ["A", "B"] } }))).toEqual(["A", "B"]);
    expect(matchedAgencies(lead())).toEqual([]);
  });

  it("não altera score nem signals nem o lead", () => {
    const l = lead({
      score: 7,
      signals: [{ code: "multi_agency_listing" }] as unknown as Lead["signals"],
      multi_agency_likelihood: { level: "probable" },
    });
    const before = structuredClone(l);
    const query: LeadQuery = {
      q: "", status: ALL, zone: ALL, priority: ALL, typology: ALL, multi: "probable", sort: "score", dir: "desc",
    };
    multiAgencyLevel(l);
    const out = applyLeadQuery([l], query);
    expect(l).toEqual(before);
    expect(out[0].score).toBe(7);
  });
});
