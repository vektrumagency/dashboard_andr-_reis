/**
 * Vocabulário confirmado por leitura direta dos 17 leads reais na Mongo
 * (2026-07-09) — não há metadado de polaridade vindo do backend, por isso
 * classificamos aqui pelo nome. Sinais que o agente do Luís venha a
 * introduzir e que ainda não estejam numa destas duas listas caem em
 * "neutral" (nem pro nem con) em vez de serem assumidos como positivos —
 * confirmar com ele o significado antes de os adicionar a uma das listas.
 */
const POSITIVE_SIGNALS = new Set([
  "international_buyer_fit",
  "outdoor_space_premium",
  "premium_zone",
]);

const NEGATIVE_SIGNALS = new Set([
  "generic_description",
  "no_floor_plan",
  "no_virtual_tour",
  "presentation_below_asset_quality",
  "price_m2_above_zone",
  "price_m2_above_zone_without_premium_features",
  "weak_photos",
  "owner_occupied_photos",
]);

export type SignalPolarity = "positive" | "negative" | "neutral";

export function signalPolarity(signal: string): SignalPolarity {
  if (NEGATIVE_SIGNALS.has(signal)) return "negative";
  if (POSITIVE_SIGNALS.has(signal)) return "positive";
  return "neutral";
}

export function isNegativeSignal(signal: string): boolean {
  return signalPolarity(signal) === "negative";
}
