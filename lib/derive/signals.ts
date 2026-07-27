import { Polarity } from "../tone";

/**
 * Substitui lib/signals.ts (código morto: zero importadores, e as suas
 * duas listas cobriam só 2 dos 12 sinais realmente vistos na Mongo em
 * 2026-07-27). Vocabulário confirmado por leitura directa dos 10 leads
 * reais nessa data — os 12 valores abaixo são todos os que existem hoje.
 * Um sinal desconhecido cai em "neutral" com o rótulo em bruto, nunca é
 * escondido nem assumido positivo/negativo.
 *
 * Duas reclassificações deliberadas face à versão anterior — a validar
 * com o André, porque mudam o que o card destaca visualmente:
 *  - `strong_fundamentals_weak_marketing` passa a POSITIVO: é o sinal mais
 *    valioso para um consultor (bom activo, mau marketing → espaço para
 *    ganhar o mandato), não deveria ler como defeito.
 *  - `owner_occupied_photos` passa a NEUTRO: é informação sobre quem
 *    contactar, não um problema do imóvel.
 */

export interface SignalMeta {
  label: string;
  polarity: Polarity;
}

const SIGNAL_META: Record<string, SignalMeta> = {
  no_virtual_tour: { label: "Sem tour virtual", polarity: "negative" },
  no_floor_plan: { label: "Sem planta", polarity: "negative" },
  weak_photos: { label: "Fotografias fracas", polarity: "negative" },
  presentation_below_asset_quality: {
    label: "Apresentação abaixo do imóvel",
    polarity: "negative",
  },
  strong_fundamentals_weak_marketing: {
    label: "Bons fundamentos, marketing fraco",
    polarity: "positive",
  },
  price_m2_above_zone: { label: "€/m² acima da zona", polarity: "warning" },
  price_m2_far_above_zone: { label: "€/m² muito acima da zona", polarity: "negative" },
  trophy_price_ordinary_asset: {
    label: "Preço de troféu, imóvel comum",
    polarity: "negative",
  },
  amenity_stack_mismatch: {
    label: "Comodidades não justificam o preço",
    polarity: "negative",
  },
  deferred_modernization: { label: "Modernização em atraso", polarity: "warning" },
  furnished_listing: { label: "Anúncio mobilado", polarity: "neutral" },
  owner_occupied_photos: {
    label: "Fotos com proprietário a habitar",
    polarity: "neutral",
  },
};

/** Nunca devolve null — um sinal desconhecido do backend fica visível, não escondido. */
export function signalMeta(signal: string): SignalMeta {
  return SIGNAL_META[signal] ?? { label: signal, polarity: "neutral" };
}

export function signalsFor(signals: string[] | null | undefined): SignalMeta[] {
  return (signals ?? []).map(signalMeta);
}
