import { Lead, LocalizationAnswer, LocalizationConfidence } from "./types";

export const LOCALIZATION_CONFIDENCE_LABELS: Record<LocalizationConfidence, string> = {
  high: "Confiança alta",
  medium: "Confiança média",
  low: "Confiança baixa",
};

export function localizationMapsUrl(answer: LocalizationAnswer): string {
  const query =
    answer.latitude != null && answer.longitude != null
      ? `${answer.latitude},${answer.longitude}`
      : answer.formatted_address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function groupLocalizationLeads(leads: Lead[]): {
  processing: Lead[];
  answered: Lead[];
} {
  const locating = leads.filter((lead) => lead.status === "locating");
  const newestFirst = (a: Lead, b: Lead) =>
    new Date(b.localization_case?.updated_at ?? b.updated_at).getTime() -
    new Date(a.localization_case?.updated_at ?? a.updated_at).getTime();
  return {
    processing: locating
      .filter((lead) => (lead.localization_case?.status ?? "processing") === "processing")
      .sort(newestFirst),
    answered: locating
      .filter((lead) => lead.localization_case?.status === "answered")
      .sort(newestFirst),
  };
}
