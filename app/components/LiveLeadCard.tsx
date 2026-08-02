"use client";

import { Lead } from "@/lib/types";
import { AdjacentResult, LeadQuery } from "@/lib/leadQuery";
import { useLeads } from "@/lib/leadsStore";
import { LeadDetail } from "./lead/LeadDetail";

/**
 * `lead` vem do servidor (getLead, documento completo — briefing, análise
 * visual, etc.). O contexto (`useLeads`) só guarda a lista projetada
 * (getLeadsList, sem esses campos pesados — ver lib/api.ts), usada para
 * a actualização optimista de estado.
 *
 * Por isso a fusão é sobreposição de CAMPOS, não substituição do lead:
 * antes fazia `leads.find(id) ?? lead`, o que trocava o lead completo por
 * uma versão mais magra assim que a lista carregava — perdendo toda a
 * análise. Só `status` é tocado pela store (updateStatus), mas
 * `localization_case` também se sobrepõe porque pode ter sido atualizado
 * no backend do Luís entre carregamentos.
 */
export function LiveLeadCard({
  lead,
  adjacency,
  query,
}: {
  lead: Lead;
  adjacency: AdjacentResult;
  query: LeadQuery;
}) {
  const { leads } = useLeads();
  const overlay = leads.find((item) => item.id === lead.id);
  const live: Lead = overlay
    ? { ...lead, status: overlay.status, localization_case: overlay.localization_case }
    : lead;
  return <LeadDetail lead={live} adjacency={adjacency} query={query} />;
}
