import { Property } from "../types";
import { Polarity, polarityTone } from "../tone";

/**
 * Modelo visual da banda de referência de mercado — substitui a parede de
 * texto cinzento do PricePerSqmComparison actual. Os valores de origem têm
 * outliers extremos confirmados na Mongo real (2026-07-27): um lead a
 * -66% da referência ajustada, outro bem acima da banda superior. Sem
 * clamping ao domínio, esses dois casos tornam a barra ilegível — ou o
 * outlier fica esmagado num pixel, ou a banda "normal" fica minúscula.
 *
 * Regra: cap relativo à banda MAIS LARGA (não aos dados brutos), para essa
 * banda ocupar sempre uma fracção generosa do eixo visível; o que ficar de
 * fora do domínio aparece como marcador "fora de escala" encostado à
 * margem, com o valor real e a percentagem por texto — nunca escondido.
 */

export interface BandRange {
  low: number;
  high: number;
  /** Posição normalizada [0,1] de low/high dentro do domínio do eixo. */
  lowPos: number;
  highPos: number;
}

export interface BandMarker {
  value: number;
  /** Posição normalizada [0,1]; se offScale, já vem fixada a 0.02/0.98. */
  pos: number;
  offScale: "low" | "high" | null;
}

export interface PriceBandModel {
  base: BandRange | null;
  adjusted: BandRange | null;
  listing: BandMarker | null;
  vsBasePct: number | null;
  vsAdjustedPct: number | null;
  position: string | null;
  bandPosition: string | null;
  tone: Polarity;
  topBandLabel: string | null;
  asksIntoTopBand: boolean;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function priceBandModel(property: Property): PriceBandModel | null {
  const base =
    property.market_reference_range_low_per_sqm != null &&
    property.market_reference_range_high_per_sqm != null
      ? {
          low: property.market_reference_range_low_per_sqm,
          high: property.market_reference_range_high_per_sqm,
        }
      : null;
  const adjusted =
    property.market_reference_adjusted_low_per_sqm != null &&
    property.market_reference_adjusted_high_per_sqm != null
      ? {
          low: property.market_reference_adjusted_low_per_sqm,
          high: property.market_reference_adjusted_high_per_sqm,
        }
      : null;
  const listingValue = property.price_per_sqm;

  if (!base && !adjusted) return null;

  /*
   * O domínio do eixo vem SÓ das bandas de referência (base/ajustada), não
   * do valor do próprio anúncio — é isso que impede o outlier (-66%, ou
   * bem acima da banda) de esmagar a banda "normal" a um traço fino. Um
   * listing fora do domínio fica marcado "fora de escala" em vez de
   * forçar o eixo a esticar para o incluir.
   */
  const bandValues = [base?.low, base?.high, adjusted?.low, adjusted?.high].filter(
    (v): v is number => v != null,
  );
  const rawMin = Math.min(...bandValues);
  const rawMax = Math.max(...bandValues);
  const margin = (rawMax - rawMin) * 0.15 || rawMax * 0.1;
  const domainMin = rawMin - margin;
  const domainMax = rawMax + margin;
  const span = domainMax - domainMin || 1;

  function pos(value: number): number {
    return clamp01((value - domainMin) / span);
  }

  function toRange(band: { low: number; high: number } | null): BandRange | null {
    if (!band) return null;
    return { low: band.low, high: band.high, lowPos: pos(band.low), highPos: pos(band.high) };
  }

  function toMarker(value: number | null): BandMarker | null {
    if (value == null) return null;
    if (value < domainMin) return { value, pos: 0.02, offScale: "low" };
    if (value > domainMax) return { value, pos: 0.98, offScale: "high" };
    return { value, pos: pos(value), offScale: null };
  }

  const toneMap: Record<string, Polarity> = {
    below_market: "positive",
    above_market: "negative",
    around_market: "neutral",
  };

  return {
    base: toRange(base),
    adjusted: toRange(adjusted),
    listing: toMarker(listingValue),
    vsBasePct: property.price_vs_base_market_pct ?? null,
    vsAdjustedPct: property.price_vs_market_pct ?? null,
    position: property.price_market_position ?? null,
    bandPosition: property.price_band_position ?? null,
    tone: (property.price_market_position && toneMap[property.price_market_position]) || "neutral",
    topBandLabel: property.market_reference_top_band_label ?? null,
    asksIntoTopBand: property.price_asks_into_top_band === true,
  };
}

export function priceBandTone(model: PriceBandModel) {
  return polarityTone(model.tone);
}
