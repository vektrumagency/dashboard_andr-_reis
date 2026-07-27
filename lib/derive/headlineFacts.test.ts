import { describe, expect, it } from "vitest";
import { leadHeadlineFacts } from "./headlineFacts";
import { Lead, Property, Seller } from "../types";

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
});
