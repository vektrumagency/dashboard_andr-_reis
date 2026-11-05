import { describe, expect, it } from "vitest";
import {
  adjacentInQuery,
  applyLeadQuery,
  ALL,
  LeadQuery,
  MULTI_AGENCY_FILTER_LABELS,
  leadHref,
  leadQueryToSearchParams,
  leadsIndexHref,
  parseLeadQuery,
} from "./leadQuery";
import { ALL_MULTI_AGENCY_FILTERS } from "./derive/multiAgency";
import { Lead, Property, Seller } from "./types";

function makeLead(id: string, overrides: Partial<Lead> = {}, propertyOverrides: Partial<Property> = {}): Lead {
  const property: Property = {
    title: null,
    zone: "Cascais",
    micro_zone: null,
    typology: "T3",
    property_type: null,
    price_current: 1000000,
    price_initial: 1000000,
    price_reduction_amount: null,
    price_reduction_pct: null,
    area_sqm: 200,
    price_per_sqm: 5000,
    furnished: null,
    days_on_market: null,
    listing_url: null,
    published_date: null,
    lat: null,
    lng: null,
    images: [],
    ...propertyOverrides,
  };
  const seller: Seller = {
    type: "agency",
    name: null,
    agency_name: null,
    phone: null,
    email: null,
    contact_source: null,
  };
  return {
    id,
    market: "cascais",
    source: "idealista",
    status: "new",
    priority: "medium",
    score: 5,
    property,
    seller,
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
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const baseQuery: LeadQuery = {
  q: "",
  status: ALL,
  zone: ALL,
  priority: ALL,
  typology: ALL,
  multi: ALL,
  sort: "score",
  dir: "desc",
};

describe("applyLeadQuery", () => {
  it("filtra por estado sem afetar a ordenação por score", () => {
    const leads = [
      makeLead("a", { status: "new", score: 3 }),
      makeLead("b", { status: "contacted", score: 9 }),
      makeLead("c", { status: "new", score: 7 }),
    ];
    const result = applyLeadQuery(leads, { ...baseQuery, status: "new" });
    expect(result.map((l) => l.id)).toEqual(["c", "a"]);
  });

  it("ordena por preço ascendente quando pedido", () => {
    const leads = [
      makeLead("a", {}, { price_current: 3_000_000 }),
      makeLead("b", {}, { price_current: 1_000_000 }),
      makeLead("c", {}, { price_current: 2_000_000 }),
    ];
    const result = applyLeadQuery(leads, { ...baseQuery, sort: "price", dir: "asc" });
    expect(result.map((l) => l.id)).toEqual(["b", "c", "a"]);
  });
});

describe("adjacentInQuery", () => {
  const leads = [
    makeLead("a", { status: "new", score: 10 }),
    makeLead("b", { status: "contacted", score: 9 }),
    makeLead("c", { status: "new", score: 7 }),
    makeLead("d", { status: "new", score: 3 }),
  ];

  it("nunca sai do conjunto filtrado — o bug original das setas", () => {
    // Filtrado por status=new, a lista visível é [a, c, d] (b é "contacted" e fica de fora).
    const query: LeadQuery = { ...baseQuery, status: "new" };
    const result = adjacentInQuery(leads, query, "a");
    // O próximo de "a" tem de ser "c" (o próximo NOVO), nunca "b" (contactado).
    expect(result.nextId).toBe("c");
    expect(result.prevId).toBeNull();
    expect(result.total).toBe(3);
  });

  it("o primeiro elemento não tem prevId, o último não tem nextId", () => {
    const query: LeadQuery = { ...baseQuery, status: "new" };
    const first = adjacentInQuery(leads, query, "a");
    const last = adjacentInQuery(leads, query, "d");
    expect(first.prevId).toBeNull();
    expect(last.nextId).toBeNull();
    expect(first.index).toBe(1);
    expect(last.index).toBe(3);
  });

  it("devolve índice -1 quando o lead atual já não pertence à lista filtrada", () => {
    const query: LeadQuery = { ...baseQuery, status: "contacted" };
    const result = adjacentInQuery(leads, query, "a");
    expect(result.index).toBe(-1);
    expect(result.prevId).toBeNull();
    expect(result.nextId).toBeNull();
  });
});

describe("filtro multi-agência", () => {
  const leads = [
    makeLead("conf", { multi_agency_likelihood: { level: "confirmed" } }),
    makeLead("prob", { multi_agency_likelihood: { level: "probable" } }),
    makeLead("unk", { multi_agency_likelihood: { level: "unknown" } }),
    makeLead("unl", { multi_agency_likelihood: { level: "unlikely" } }),
    makeLead("old-conf", { multi_agency_detection: { status: "confirmed", matched_agency: "ERA" } }),
    makeLead("old-prob", { multi_agency_detection: { status: "no_match", different_advertiser_confirmed: true } }),
    makeLead("old-none"),
  ];
  const ids = (multi: LeadQuery["multi"]) =>
    applyLeadQuery(leads, { ...baseQuery, multi, sort: "score" }).map((l) => l.id).sort();

  it("filtra por cada valor, incluindo leads sem o campo novo", () => {
    expect(ids("confirmed")).toEqual(["conf", "old-conf"]);
    expect(ids("probable")).toEqual(["old-prob", "prob"]);
    expect(ids("confirmed_or_probable")).toEqual(["conf", "old-conf", "old-prob", "prob"]);
    expect(ids("unlikely")).toEqual(["unl"]);
    expect(ids("unknown")).toEqual(["old-none", "unk"]);
    expect(ids(ALL)).toHaveLength(7);
  });

  it("ida e volta na URL", () => {
    const query = parseLeadQuery(new URLSearchParams("multi=probable&status=Todas"));
    expect(query.multi).toBe("probable");
    expect(parseLeadQuery(leadQueryToSearchParams(query))).toEqual(query);
  });

  it("ida e volta na URL com unlikely, que tem rótulo PT-PT", () => {
    const query = parseLeadQuery(new URLSearchParams("multi=unlikely"));
    expect(query.multi).toBe("unlikely");
    expect(leadQueryToSearchParams(query).get("multi")).toBe("unlikely");
    expect(ALL_MULTI_AGENCY_FILTERS).toContain("unlikely");
    expect(MULTI_AGENCY_FILTER_LABELS.unlikely).toBe("Exclusivo segundo o anúncio");
  });

  it("valor inválido volta a Todas", () => {
    expect(parseLeadQuery(new URLSearchParams("multi=xyz")).multi).toBe(ALL);
  });

  it("a URL por omissão não inclui multi", () => {
    expect(leadQueryToSearchParams(parseLeadQuery(new URLSearchParams())).has("multi")).toBe(false);
  });

  it("leadHref e leadsIndexHref preservam multi", () => {
    const query = { ...baseQuery, status: "new" as const, multi: "probable" as const };
    expect(leadHref("x", query)).toContain("multi=probable");
    expect(leadsIndexHref(query)).toContain("multi=probable");
  });

  it("as setas ficam dentro do conjunto filtrado por multi", () => {
    const query: LeadQuery = { ...baseQuery, multi: "confirmed" };
    const result = adjacentInQuery(leads, query, "conf");
    expect([result.prevId, result.nextId].filter(Boolean).sort()).toEqual(["old-conf"]);
    expect(result.total).toBe(2);
  });
});
