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

export function zoneTier(zone: string | null): 1 | 2 | 3 {
  if (!zone) return 3;
  return ZONE_TIERS[zone] ?? 3;
}
