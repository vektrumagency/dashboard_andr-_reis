import { Lead, LeadPriority, LeadStatus } from "./types";

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Contactado",
  visit: "Visita",
  not_relevant: "Não relevante",
};

export const PRIORITY_LABELS: Record<LeadPriority, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
  exclude: "Excluído",
};

export const ALL_STATUSES: LeadStatus[] = ["new", "contacted", "visit", "not_relevant"];

export const ALL_PRIORITIES: LeadPriority[] = ["high", "medium", "low", "exclude"];

export function uniqueZones(leads: Lead[]): string[] {
  return Array.from(
    new Set(leads.map((lead) => lead.property.zone).filter((zone): zone is string => !!zone)),
  ).sort();
}

export function uniqueTypologies(leads: Lead[]): string[] {
  return Array.from(
    new Set(
      leads.map((lead) => lead.property.typology).filter((t): t is string => !!t),
    ),
  ).sort();
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function searchLeads(leads: Lead[], query: string): Lead[] {
  const trimmed = query.trim();
  if (!trimmed) return leads;

  if (/^\d+$/.test(trimmed)) {
    const minScore = Number(trimmed);
    return leads.filter((lead) => lead.score >= minScore);
  }

  const needle = normalize(trimmed);
  return leads.filter((lead) => {
    const haystack = normalize(
      [
        lead.id,
        lead.property.zone,
        lead.property.micro_zone,
        lead.property.typology,
        lead.property.title,
        lead.seller.name,
        lead.seller.agency_name,
        lead.manual_notes,
        ...lead.signals,
      ]
        .filter((part): part is string => !!part)
        .join(" "),
    );
    return haystack.includes(needle);
  });
}

export function adjacentLeadIds(
  leads: Lead[],
  currentId: string,
): { prevId: string | null; nextId: string | null } {
  const sorted = [...leads].sort((a, b) => b.score - a.score);
  const index = sorted.findIndex((lead) => lead.id === currentId);
  if (index === -1) return { prevId: null, nextId: null };
  return {
    prevId: index > 0 ? sorted[index - 1].id : null,
    nextId: index < sorted.length - 1 ? sorted[index + 1].id : null,
  };
}
