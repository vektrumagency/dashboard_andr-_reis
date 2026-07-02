import { cache } from "react";
import { Lead } from "./types";

/**
 * Cliente server-side para a API do lead-researcher (FastAPI, projeto do
 * Luís). Nunca chamado do browser — mantém a URL do backend fora do bundle
 * do cliente e evita ter de configurar CORS no FastAPI (ver route handlers
 * em app/api/leads/[id] que fazem de proxy para as mutações).
 */
const API_URL = process.env.LEAD_RESEARCHER_API_URL ?? "http://localhost:8000";

/**
 * O Property do backend ainda não tem lat/lng nem furnished, e usa
 * image_urls em vez de images — normalizamos aqui para o resto da app não
 * ter de saber da forma exata da API.
 */
type RawProperty = Omit<Lead["property"], "images" | "furnished" | "lat" | "lng"> & {
  image_urls?: string[];
};

type RawLead = Omit<Lead, "property"> & { property: RawProperty };

function normalizeLead(raw: RawLead): Lead {
  return {
    ...raw,
    property: {
      ...raw.property,
      furnished: null,
      lat: null,
      lng: null,
      images: raw.property.image_urls ?? [],
    },
  };
}

/**
 * cache() dedupe pedidos dentro do mesmo request/render — evita 3 chamadas
 * à API (layout + página do lead + modal interceptado) por navegação.
 */
export const getLeads = cache(async (): Promise<Lead[]> => {
  const res = await fetch(`${API_URL}/leads`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`GET /leads falhou: ${res.status} ${res.statusText}`);
  }
  const raw: RawLead[] = await res.json();
  return raw.map(normalizeLead);
});

export async function updateLeadStatus(id: string, status: Lead["status"]): Promise<Lead> {
  const res = await fetch(`${API_URL}/leads/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`PATCH /leads/${id}/status falhou: ${res.status} ${res.statusText}`);
  }
  const raw: RawLead = await res.json();
  return normalizeLead(raw);
}
