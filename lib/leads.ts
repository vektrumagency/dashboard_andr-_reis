import { Lead, LeadStatus } from "./types";

/**
 * Próxima ação sugerida — derivada do estado do lead, não é um campo do
 * backend. Evita assumir um campo `next_action` na base de dados antes de
 * confirmar com o Luís.
 */
export function getNextAction(lead: Lead): string {
  switch (lead.status) {
    case "Por contactar":
      return lead.priority === "HIGH"
        ? "Contactar com prioridade — preparar mensagem de outreach"
        : "Adicionar à fila de outreach";
    case "Contactado":
      return "Aguardar resposta — fazer follow-up se não houver retorno em 5 dias";
    case "Em negociação":
      return "Acompanhar negociação e preparar contraproposta se necessário";
    case "Fechado":
      return "Sem ação necessária";
    default:
      return "—";
  }
}

export function uniqueZones(leads: Lead[]): string[] {
  return Array.from(new Set(leads.map((lead) => lead.zone))).sort();
}

export function uniqueTypologies(leads: Lead[]): string[] {
  return Array.from(new Set(leads.map((lead) => lead.typology))).sort();
}

export const ALL_PRIORITIES: Lead["priority"][] = ["HIGH", "MEDIUM", "LOW"];

export const ALL_STATUSES: LeadStatus[] = [
  "Por contactar",
  "Contactado",
  "Em negociação",
  "Fechado",
];
