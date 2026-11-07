import { ActiveMarketId, MarketId } from "./types";

/**
 * zone_tier não é persistido no Lead (é só um input efémero do scoring no
 * backend). Mapeamento estático para a UI, copiado de
 * lead-researcher/markets.yaml (`zone_tiers`) e, para Cascais, de
 * lead-researcher/icps/ICP-Cascais.md ("Zone tiers").
 */
const ZONE_TIERS: Record<string, 1 | 2 | 3> = {
  // Cascais
  "Quinta da Marinha": 1,
  Birre: 1,
  Guincho: 1,
  "Monte Estoril": 1,
  "Cascais Centro": 2,
  Estoril: 2,
  // Lisboa — Belém/Restelo passou a ser uma zona de Lisboa (zona-casa do André).
  "Belém / Restelo": 1,
  "Estrela / Lapa": 1,
  "Chiado / Príncipe Real": 1,
  "Avenida da Liberdade": 1,
  "Campo de Ourique": 2,
  "Avenidas Novas": 2,
  "Areeiro / Alvalade": 2,
  "Parque das Nações": 2,
  Alcântara: 2,
  // Oeiras
  "Algés / Dafundo / Cruz Quebrada": 1,
  "Oeiras Centro / São Julião": 1,
  "Paço de Arcos / Caxias": 1,
  "Linda-a-Velha": 2,
  "Carnaxide / Queijas": 2,
  // Amadora
  Alfragide: 1,
  "Amadora Centro / Venteira": 2,
  "Mina de Água": 2,
};

/** Mercados com pesquisa activa, pela ordem em que aparecem no filtro. */
export const ACTIVE_MARKETS: ActiveMarketId[] = ["lisboa", "cascais", "oeiras", "amadora"];

/**
 * Os mercados históricos já não recebem pesquisa nova, mas os leads antigos
 * continuam legíveis — e aparecem dentro do mercado activo que os absorveu
 * (Belém/Restelo é agora uma zona de Lisboa; Algés faz parte de Oeiras).
 */
const MARKET_PARENT: Record<MarketId, ActiveMarketId> = {
  lisboa: "lisboa",
  cascais: "cascais",
  oeiras: "oeiras",
  amadora: "amadora",
  belem_restelo: "lisboa",
  alges_arredores: "oeiras",
};

/** Mercado activo a que um lead pertence (leads históricos caem no mercado que os absorveu). */
export function activeMarketOf(market: MarketId | string): ActiveMarketId | null {
  return MARKET_PARENT[market as MarketId] ?? null;
}

/**
 * Zonas conhecidas por mercado activo (nomes canónicos do backend, ver
 * `zone_aliases` em markets.yaml). O filtro de zona junta-lhes as zonas que
 * aparecem de facto nos leads — ver zonesForMarket em lib/leads.ts.
 */
export const MARKET_ZONES: Record<ActiveMarketId, string[]> = {
  lisboa: [
    "Belém / Restelo",
    "Ajuda",
    "Alcântara",
    "Estrela / Lapa",
    "Campo de Ourique",
    "Chiado / Príncipe Real",
    "Avenida da Liberdade",
    "Avenidas Novas",
    "Areeiro / Alvalade",
    "Parque das Nações",
    "Arroios / Graça",
    "Baixa / Alfama",
    "Campolide / Benfica",
    "Lumiar / Telheiras",
    "Lisboa Oriental",
  ],
  cascais: ["Quinta da Marinha", "Birre", "Guincho", "Monte Estoril", "Cascais Centro", "Estoril"],
  oeiras: [
    "Algés / Dafundo / Cruz Quebrada",
    "Linda-a-Velha",
    "Carnaxide / Queijas",
    "Oeiras Centro / São Julião",
    "Paço de Arcos / Caxias",
    "Porto Salvo / Barcarena",
  ],
  amadora: [
    "Amadora Centro / Venteira",
    "Alfragide",
    "Mina de Água",
    "Encosta do Sol / Brandoa",
    "Águas Livres / Damaia",
  ],
};

/**
 * Devolve null para zonas sem tier definido — nunca inventamos um tier
 * para não sugerir uma classificação que não existe.
 */
export function zoneTier(zone: string | null): 1 | 2 | 3 | null {
  if (!zone) return null;
  return ZONE_TIERS[zone] ?? null;
}
