import { describe, expect, it } from "vitest";
import { leadHeadlineFacts } from "./headlineFacts";
import { Lead, Property, Seller } from "../types";
import { MultiAgencyLevel } from "../types/analysis";
import { ALL_MULTI_AGENCY_FILTERS, multiAgencyLevel } from "./multiAgency";
import { applyLeadQuery, parseLeadQuery } from "../leadQuery";

function baseProperty(overrides: Partial<Property> = {}): Property {
  return {
    title: null,
    zone: "Belém",
    micro_zone: "Belém",
    typology: null,
    property_type: null,
    price_current: 2350000,
    price_initial: 2350000,
    price_reduction_amount: null,
    price_reduction_pct: null,
    area_sqm: 702,
    price_per_sqm: 3347.58,
    furnished: null,
    days_on_market: null,
    listing_url: null,
    published_date: null,
    lat: null,
    lng: null,
    images: [],
    is_new_development: false,
    ...overrides,
  };
}

function baseSeller(overrides: Partial<Seller> = {}): Seller {
  return {
    type: "agency",
    name: null,
    agency_name: "ORIA Real Estate Advisors",
    phone: null,
    email: null,
    contact_source: null,
    ...overrides,
  };
}

function baseLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "1",
    market: "belem_restelo",
    source: "idealista",
    status: "new",
    priority: "low",
    score: 2,
    property: baseProperty(),
    seller: baseSeller(),
    signals: [],
    ai_note: {
      diagnosis: null,
      owner_reading: null,
      entry_angle: null,
      next_action: null,
      suggested_message: null,
    },
    manual_notes: null,
    price_history: [],
    created_at: "2026-07-26T23:04:34.678826Z",
    updated_at: "2026-07-26T23:27:59.002Z",
    ...overrides,
  };
}

describe("leadHeadlineFacts", () => {
  it("nunca inclui um facto para um campo desconhecido — degrada para ausente, não para vazio", () => {
    const lead = baseLead();
    const facts = leadHeadlineFacts(lead);
    // Sem multi_agency_detection, sem visual_assessment, sem property_intelligence,
    // is_new_development=false, mas COM agência — só o facto de agência deve aparecer.
    expect(facts.map((f) => f.key)).toEqual(["agency"]);
    expect(facts[0].value).toBe("ORIA Real Estate Advisors");
  });

  it("omite o facto de multi-agência quando o backend nunca verificou (status skipped)", () => {
    const lead = baseLead({
      multi_agency_detection: { status: "skipped" },
    });
    const facts = leadHeadlineFacts(lead);
    expect(facts.some((f) => f.key === "multi_agency")).toBe(false);
  });

  it("mostra multi-agência confirmada quando há agências correspondidas", () => {
    const lead = baseLead({
      multi_agency_detection: {
        status: "confirmed",
        matched_agencies: ["Century 21", "Remax"],
        same_property_confidence: 0.9,
      },
    });
    const facts = leadHeadlineFacts(lead);
    const fact = facts.find((f) => f.key === "multi_agency");
    expect(fact?.value).toContain("2 agências");
  });

  it("omite mobília e ocupação quando 'unclear', mas não quando conhecidas", () => {
    const clear = baseLead({
      visual_assessment: { furniture_status: "unclear", occupancy_cues: "vacant" },
    });
    const facts = leadHeadlineFacts(clear);
    expect(facts.some((f) => f.key === "furniture")).toBe(false);
    expect(facts.some((f) => f.key === "occupancy")).toBe(true);
  });

  it("só mostra construção nova quando é true — false não é ruído", () => {
    const notNew = baseLead({ property: baseProperty({ is_new_development: false }) });
    expect(leadHeadlineFacts(notNew).some((f) => f.key === "new_development")).toBe(false);

    const isNew = baseLead({ property: baseProperty({ is_new_development: true, }) });
    const facts = leadHeadlineFacts(isNew);
    expect(facts.some((f) => f.key === "new_development")).toBe(true);
  });

  it("nunca excede 6 factos", () => {
    const lead = baseLead({
      multi_agency_detection: { status: "confirmed", matched_agencies: ["A", "B"] },
      visual_assessment: {
        furniture_status: "furnished",
        occupancy_cues: "lived_in",
        overall_condition: "good",
      },
      property: baseProperty({ is_new_development: true }),
      property_intelligence: { luxury_tier: "luxury", condition: "excellent" },
    });
    expect(leadHeadlineFacts(lead).length).toBeLessThanOrEqual(6);
  });

  describe("multi-agência", () => {
    const factOf = (lead: Lead) => leadHeadlineFacts(lead).find((f) => f.key === "multi_agency");

    it("confirmed do campo derivado", () => {
      const fact = factOf(
        baseLead({
          multi_agency_likelihood: {
            level: "confirmed",
            reasons: [{ source: "photo_match", code: "photos_confirmed", detail: "ERA" }],
          },
          multi_agency_detection: { status: "confirmed", matched_agency: "ERA" },
        }),
      );
      expect(fact?.value).toBe("Sim · 1 agência");
      expect(fact?.detail).toBe("ERA");
    });

    it("probable por regra da agência mostra a origem", () => {
      const fact = factOf(
        baseLead({
          multi_agency_likelihood: {
            level: "probable",
            reasons: [{ source: "agency_rule", code: "agency_non_exclusive", detail: "ERA" }],
          },
        }),
      );
      expect(fact?.value).toBe("Provável · regra da agência (ERA)");
    });

    it("probable por texto do anúncio vence a regra na origem", () => {
      const fact = factOf(
        baseLead({
          multi_agency_likelihood: {
            level: "probable",
            reasons: [
              { source: "agency_rule", code: "agency_non_exclusive", detail: "ERA" },
              { source: "description_text", code: "text_non_exclusive" },
            ],
          },
        }),
      );
      expect(fact?.value).toBe("Provável · descrição do anúncio");
    });

    it("unlikely mostra 'Exclusivo segundo o anúncio'", () => {
      const fact = factOf(baseLead({ multi_agency_likelihood: { level: "unlikely", reasons: [] } }));
      expect(fact?.value).toBe("Exclusivo segundo o anúncio");
    });

    it("unknown calculado esconde o facto, salvo evidência insuficiente", () => {
      expect(factOf(baseLead({ multi_agency_likelihood: { level: "unknown", reasons: [] } }))).toBeUndefined();
      const fact = factOf(
        baseLead({
          multi_agency_likelihood: { level: "unknown", reasons: [] },
          multi_agency_detection: { status: "insufficient_evidence" },
        }),
      );
      expect(fact?.value).toBe("Sem indícios");
    });

    it("fallback sem o campo: matched_agency singular dá 'Sim'", () => {
      const fact = factOf(
        baseLead({ multi_agency_detection: { status: "confirmed", matched_agency: "Century 21" } }),
      );
      expect(fact?.value).toBe("Sim · 1 agência");
    });

    it("fallback sem o campo: different_advertiser_confirmed sem confirmed dá 'Provável · fotos'", () => {
      const fact = factOf(
        baseLead({ multi_agency_detection: { status: "no_match", different_advertiser_confirmed: true } }),
      );
      expect(fact?.value).toBe("Provável · fotos");
    });

    it("lead sem nenhum dos campos continua a renderizar sem facto", () => {
      expect(factOf(baseLead())).toBeUndefined();
    });

    it("'probable' sem razões não inventa 'fotos' como origem", () => {
      expect(factOf(baseLead({ multi_agency_likelihood: { level: "probable", reasons: [] } }))?.value).toBe("Provável");
      const unknownReason = baseLead({
        multi_agency_likelihood: { level: "probable", reasons: [{ code: "novo" }] },
      });
      expect(factOf(unknownReason)?.value).toBe("Provável");
      const photos = baseLead({
        multi_agency_likelihood: { level: "probable", reasons: [{ code: "photos_different_advertiser" }] },
      });
      expect(factOf(photos)?.value).toBe("Provável · fotos");
    });

    it("likelihood mais antiga que a deteção por fotos cai no fallback das fotos", () => {
      const lead = baseLead({
        multi_agency_likelihood: { level: "unknown", computed_at: "2026-11-01T00:00:00Z" },
        multi_agency_detection: {
          status: "confirmed",
          matched_agencies: ["A"],
          checked_at: "2026-11-02T00:00:00Z",
        },
      });
      expect(multiAgencyLevel(lead)).toBe("confirmed");
      expect(factOf(lead)?.value).toBe("Sim · 1 agência");
    });

    it("o facto e o filtro dão a mesma categoria para o mesmo lead", () => {
      const leads = [
        baseLead({ multi_agency_likelihood: { level: "confirmed" } }),
        baseLead({ multi_agency_likelihood: { level: "probable", reasons: [] } }),
        baseLead({ multi_agency_likelihood: { level: "unlikely" } }),
        baseLead({ multi_agency_likelihood: { level: "unknown" } }),
        baseLead({
          multi_agency_likelihood: { level: "unknown", computed_at: "2026-11-01T00:00:00Z" },
          multi_agency_detection: { status: "confirmed", matched_agencies: ["A"], checked_at: "2026-11-02T00:00:00Z" },
        }),
        baseLead({ multi_agency_detection: { status: "confirmed", matched_agencies: ["A"] } }),
        baseLead({ multi_agency_detection: { status: "no_match", different_advertiser_confirmed: true } }),
        baseLead({ multi_agency_detection: { status: "skipped" } }),
        baseLead(),
      ];
      const shownAs: Record<string, MultiAgencyLevel> = {
        Sim: "confirmed",
        "Provável": "probable",
        Exclusivo: "unlikely",
      };
      for (const lead of leads) {
        const value = factOf(lead)?.value;
        // Sem facto ou "Sem indícios" só acontece em "unknown".
        const shown = (value ? shownAs[value.split(" ")[0]] : undefined) ?? "unknown";
        // O filtro real (applyLeadQuery) tem de devolver o lead exatamente nos filtros do nível mostrado.
        for (const multi of ALL_MULTI_AGENCY_FILTERS) {
          const included = applyLeadQuery([lead], { ...parseLeadQuery(new URLSearchParams()), multi }).length === 1;
          const expected = multi === "confirmed_or_probable" ? shown === "confirmed" || shown === "probable" : multi === shown;
          expect(included, `${multi} vs ${shown}`).toBe(expected);
        }
        expect(multiAgencyLevel(lead)).toBe(shown);
      }
    });
  });
});

