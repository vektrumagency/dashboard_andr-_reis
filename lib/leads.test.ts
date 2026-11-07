import { describe, expect, it } from "vitest";
import { MARKET_LABELS, marketsSummary, multiAgencyInfo } from "./leads";
import { Lead } from "./types";

function lead(overrides: Partial<Lead>): Lead {
  return {
    market: "cascais",
    seller: { type: "agency", name: null, agency_name: "IAD", phone: null, email: null, contact_source: null },
    ...overrides,
  } as Lead;
}

describe("MARKET_LABELS", () => {
  it("tem rótulos PT-PT para os mercados novos e os históricos", () => {
    expect(MARKET_LABELS.lisboa).toBe("Lisboa");
    expect(MARKET_LABELS.oeiras).toBe("Oeiras");
    expect(MARKET_LABELS.amadora).toBe("Amadora");
    expect(MARKET_LABELS.belem_restelo).toContain("Belém/Restelo");
  });
});

describe("marketsSummary", () => {
  it("conta os leads históricos no mercado activo que os absorveu", () => {
    const leads = [lead({ market: "lisboa" }), lead({ market: "belem_restelo" }), lead({ market: "oeiras" })];
    expect(marketsSummary(leads)).toBe("Lisboa e Oeiras");
  });
});

describe("multiAgencyInfo", () => {
  it("devolve null quando não há confirmação", () => {
    expect(multiAgencyInfo(lead({}))).toBeNull();
    expect(
      multiAgencyInfo(lead({ multi_agency_detection: { status: "insufficient_evidence", matched_agencies: ["ERA"] } })),
    ).toBeNull();
  });

  it("junta a agência do anúncio às agências encontradas, sem duplicados", () => {
    const info = multiAgencyInfo(
      lead({
        multi_agency_detection: {
          status: "confirmed",
          matched_agencies: ["ERA", "iad", "Remax"],
          matched_listing_ids: ["1", "2"],
        },
      }),
    );
    expect(info).toEqual({ agencies: ["IAD", "ERA", "Remax"], agencyCount: 3, listingCount: 3 });
  });

  it("usa a contagem do cluster quando é maior do que os nomes conhecidos", () => {
    const info = multiAgencyInfo(
      lead({
        seller: { type: "private", name: null, agency_name: null, phone: null, email: null, contact_source: null },
        multi_agency_detection: { status: "confirmed", matched_agencies: ["ERA"], cluster_advertiser_count: 4, cluster_listing_count: 5 },
      }),
    );
    expect(info?.agencyCount).toBe(4);
    expect(info?.listingCount).toBe(5);
    expect(info?.agencies).toEqual(["ERA"]);
  });
});
