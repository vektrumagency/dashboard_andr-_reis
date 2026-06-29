/**
 * zone_tier não é persistido no Lead (é só um input efémero do scoring no
 * backend). Mapeamento estático para a UI, copiado de
 * agents/lead-researcher/ICP-Cascais.md ("Zone tiers").
 */
const ZONE_TIERS: Record<string, 1 | 2 | 3> = {
  "Quinta da Marinha": 1,
  Birre: 1,
  Guincho: 1,
  "Monte Estoril": 1,
  "Cascais Centro": 2,
  Estoril: 2,
};

/** Preço médio de mercado por m² por zona (€/m²) — valores de referência aproximados. */
const ZONE_PRICE_PER_SQM: Record<string, number> = {
  "Quinta da Marinha": 4500,
  Birre: 4000,
  Guincho: 4500,
  "Monte Estoril": 5000,
  "Cascais Centro": 5500,
  Estoril: 5000,
};

export function zoneTier(zone: string | null): 1 | 2 | 3 {
  if (!zone) return 3;
  return ZONE_TIERS[zone] ?? 3;
}

export function zonePricePerSqm(zone: string | null): number | null {
  if (!zone) return null;
  return ZONE_PRICE_PER_SQM[zone] ?? null;
}
