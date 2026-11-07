import { describe, expect, it } from "vitest";
import {
  adjacentInQuery,
  applyLeadQuery,
  ALL,
  LeadQuery,
  leadQueryToSearchParams,
  parseLeadQuery,
  zoneOptions,
} from "./leadQuery";
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
  market: ALL,
  zone: ALL,
  multiAgency: false,
  priority: ALL,
  typology: ALL,
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

const confirmed = (agencies: string[], extra: Record<string, unknown> = {}): Partial<Lead> => ({
  multi_agency_detection: {
    status: "confirmed",
    matched_agencies: agencies,
    matched_listing_ids: agencies.map((_, i) => `listing-${i}`),
    ...extra,
  },
});

describe("filtro de mercado", () => {
  const leads = [
    makeLead("lx", { market: "lisboa" }, { zone: "Estrela / Lapa" }),
    makeLead("belem-hist", { market: "belem_restelo" }, { zone: "Belém / Restelo" }),
    makeLead("cas", { market: "cascais" }, { zone: "Birre" }),
    makeLead("oei", { market: "oeiras" }, { zone: "Linda-a-Velha" }),
    makeLead("alges-hist", { market: "alges_arredores" }, { zone: "Algés / Dafundo / Cruz Quebrada" }),
    makeLead("ama", { market: "amadora" }, { zone: "Alfragide" }),
  ];

  it("Lisboa inclui os leads históricos de Belém/Restelo", () => {
    const result = applyLeadQuery(leads, { ...baseQuery, market: "lisboa" });
    expect(result.map((l) => l.id).sort()).toEqual(["belem-hist", "lx"]);
  });

  it("Oeiras inclui os leads históricos de Algés", () => {
    const result = applyLeadQuery(leads, { ...baseQuery, market: "oeiras" });
    expect(result.map((l) => l.id).sort()).toEqual(["alges-hist", "oei"]);
  });

  it("Amadora e Cascais só mostram os seus leads", () => {
    expect(applyLeadQuery(leads, { ...baseQuery, market: "amadora" }).map((l) => l.id)).toEqual(["ama"]);
    expect(applyLeadQuery(leads, { ...baseQuery, market: "cascais" }).map((l) => l.id)).toEqual(["cas"]);
  });

  it("as zonas do filtro ficam limitadas ao mercado, com Belém/Restelo em Lisboa", () => {
    expect(zoneOptions(leads, { ...baseQuery, market: "lisboa" })).toEqual(["Belém / Restelo", "Estrela / Lapa"]);
    expect(zoneOptions(leads, baseQuery)).toHaveLength(6);
  });

  it("lê e escreve o mercado na URL, e ignora mercados históricos ou desconhecidos", () => {
    expect(parseLeadQuery(new URLSearchParams("market=oeiras")).market).toBe("oeiras");
    expect(parseLeadQuery(new URLSearchParams("market=belem_restelo")).market).toBe(ALL);
    expect(parseLeadQuery(new URLSearchParams("market=porto")).market).toBe(ALL);
    expect(leadQueryToSearchParams({ ...baseQuery, market: "amadora" }).get("market")).toBe("amadora");
  });
});

describe("multi-agência", () => {
  const leads = [
    makeLead("solo-alto", { score: 9 }),
    makeLead("multi-2", { score: 4, ...confirmed(["ERA"]) }),
    makeLead("multi-3", { score: 3, ...confirmed(["ERA", "Remax", "Century 21"]) }),
    makeLead("provavel", {
      score: 8,
      multi_agency_detection: { status: "insufficient_evidence", different_advertiser_confirmed: true },
    }),
    makeLead("cluster", {
      score: 2,
      multi_agency_detection: { status: "no_match", cluster_kind: "multi_agency", cluster_advertiser_count: 2 },
    }),
  ];

  it("o filtro só deixa passar multi-agência confirmados", () => {
    const result = applyLeadQuery(leads, { ...baseQuery, multiAgency: true });
    expect(result.map((l) => l.id).sort()).toEqual(["cluster", "multi-2", "multi-3"]);
  });

  it("aceita um property_cluster opcional com kind multi_agency", () => {
    const lead = makeLead("pc", { property_cluster: { kind: "multi_agency", agencies: ["ERA", "Remax"] } });
    expect(applyLeadQuery([lead], { ...baseQuery, multiAgency: true })).toHaveLength(1);
  });

  it("a ordenação por omissão põe os multi-agência confirmados primeiro", () => {
    const query = parseLeadQuery(new URLSearchParams("status=Todas"));
    expect(query.sort).toBe("multi_agency");
    const result = applyLeadQuery(leads, query);
    // Mais agências primeiro, depois por score; os restantes seguem por score.
    expect(result.map((l) => l.id)).toEqual(["multi-3", "multi-2", "cluster", "solo-alto", "provavel"]);
  });

  it("ordenar por score ignora a prioridade multi-agência", () => {
    const result = applyLeadQuery(leads, { ...baseQuery, sort: "score" });
    expect(result[0].id).toBe("solo-alto");
  });

  it("guarda o filtro na URL como multi=1", () => {
    const params = leadQueryToSearchParams({ ...baseQuery, multiAgency: true });
    expect(params.get("multi")).toBe("1");
    expect(parseLeadQuery(params).multiAgency).toBe(true);
    expect(parseLeadQuery(new URLSearchParams("")).multiAgency).toBe(false);
  });
});
