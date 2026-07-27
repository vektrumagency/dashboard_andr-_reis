import { describe, expect, it } from "vitest";
import { priceBandModel } from "./priceBand";
import { Property } from "../types";

function baseProperty(overrides: Partial<Property> = {}): Property {
  return {
    title: null,
    zone: null,
    micro_zone: null,
    typology: null,
    property_type: null,
    price_current: null,
    price_initial: null,
    price_reduction_amount: null,
    price_reduction_pct: null,
    area_sqm: null,
    price_per_sqm: null,
    furnished: null,
    days_on_market: null,
    listing_url: null,
    published_date: null,
    lat: null,
    lng: null,
    images: [],
    ...overrides,
  };
}

describe("priceBandModel", () => {
  it("devolve null quando não há nenhuma banda de referência", () => {
    expect(priceBandModel(baseProperty())).toBeNull();
  });

  it("mantém a banda mais larga a ocupar uma fracção generosa do eixo mesmo com um outlier extremo (-66%)", () => {
    // Caso real: Belém, listing €3.347/m² vs referência ajustada €9.940/m² (low 9130 / high 10750).
    const property = baseProperty({
      price_per_sqm: 3347.58,
      market_reference_range_low_per_sqm: 8300,
      market_reference_range_high_per_sqm: 8600,
      market_reference_adjusted_low_per_sqm: 9130,
      market_reference_adjusted_high_per_sqm: 10750,
      price_vs_base_market_pct: -0.6038,
      price_vs_market_pct: -0.6632,
      price_market_position: "below_market",
      price_band_position: "below_band",
    });
    const model = priceBandModel(property)!;
    expect(model).not.toBeNull();
    expect(model.adjusted).not.toBeNull();
    // A banda ajustada (a mais larga) deve ocupar pelo menos 40% do eixo.
    const adjustedWidth = model.adjusted!.highPos - model.adjusted!.lowPos;
    expect(adjustedWidth).toBeGreaterThanOrEqual(0.4);
    // O listing está muito abaixo do domínio visível — fica marcado fora de escala, não escondido.
    expect(model.listing?.offScale).toBe("low");
    expect(model.listing?.value).toBe(3347.58);
    expect(model.vsAdjustedPct).toBeCloseTo(-0.6632, 4);
  });

  it("marca um listing muito acima da banda como fora de escala no lado alto", () => {
    const property = baseProperty({
      price_per_sqm: 20000,
      market_reference_adjusted_low_per_sqm: 8000,
      market_reference_adjusted_high_per_sqm: 9000,
      price_market_position: "above_market",
    });
    const model = priceBandModel(property)!;
    expect(model.listing?.offScale).toBe("high");
  });

  it("funciona só com a banda base (sem ajustada)", () => {
    const property = baseProperty({
      price_per_sqm: 8500,
      market_reference_range_low_per_sqm: 8000,
      market_reference_range_high_per_sqm: 9000,
    });
    const model = priceBandModel(property)!;
    expect(model.base).not.toBeNull();
    expect(model.adjusted).toBeNull();
    expect(model.listing?.offScale).toBeNull();
  });

  it("mantém todas as posições normalizadas dentro de [0,1]", () => {
    const property = baseProperty({
      price_per_sqm: 500,
      market_reference_range_low_per_sqm: 8000,
      market_reference_range_high_per_sqm: 9000,
      market_reference_adjusted_low_per_sqm: 9000,
      market_reference_adjusted_high_per_sqm: 11000,
    });
    const model = priceBandModel(property)!;
    for (const value of [
      model.base?.lowPos,
      model.base?.highPos,
      model.adjusted?.lowPos,
      model.adjusted?.highPos,
      model.listing?.pos,
    ]) {
      if (value == null) continue;
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});
