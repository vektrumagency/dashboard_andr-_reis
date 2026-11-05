import { Building2, DoorOpen, Gem, Hammer, ShieldCheck, Sofa, type LucideIcon } from "lucide-react";
import { Lead } from "../types";
import { Polarity, polarityTone, Tone } from "../tone";
import { sellerDisplayName } from "../leads";
import { currentLikelihood, matchedAgencies, multiAgencyLevel } from "./multiAgency";
import {
  conditionLabel,
  furnitureStatusLabel,
  luxuryTierLabel,
  multiAgencyLevelLabel,
  multiAgencyLikelihoodReasonLabel,
  multiAgencyStatusLabel,
  occupancyLabel,
} from "./enums";

/**
 * As perguntas que o André faz de imediato sobre qualquer lead: é
 * multi-agência? está mobilada/ocupada? é construção nova? que agência
 * vende? Mais luxury tier e condição como contexto de segunda linha.
 * Cada facto degrada para null quando o campo de origem é desconhecido —
 * nunca aparece um rótulo com valor em branco.
 */

export interface HeadlineFact {
  key: string;
  label: string;
  value: string;
  tone: Tone;
  confidence: number | string | null;
  icon: LucideIcon;
  detail?: string | null;
}

/**
 * De onde vem um "Provável": a razão mais específica ganha (texto > regra da agência > fotos).
 * Sem razão reconhecida não se inventa origem; "fotos" exige prova por fotos.
 */
function probableOrigin(lead: Lead): string | null {
  const likelihood = currentLikelihood(lead);
  const reasons = likelihood?.reasons ?? [];
  const byCode = (code: string) => reasons.find((r) => r.code === code);
  if (byCode("text_non_exclusive")) return "descrição do anúncio";
  const rule = byCode("agency_non_exclusive");
  if (rule) return rule.detail ? `regra da agência (${rule.detail})` : "regra da agência";
  if (byCode("photos_different_advertiser")) return "fotos";
  if (!likelihood && lead.multi_agency_detection?.different_advertiser_confirmed === true) return "fotos";
  return null;
}

function reasonsDetail(lead: Lead): string | null {
  const labels = (currentLikelihood(lead)?.reasons ?? [])
    .map((r) => {
      const label = multiAgencyLikelihoodReasonLabel(r.code);
      return label && r.detail ? `${label} (${r.detail})` : label;
    })
    .filter((label): label is string => label != null);
  return labels.length > 0 ? labels.join("; ") : null;
}

function multiAgencyFact(lead: Lead): HeadlineFact | null {
  const detection = lead.multi_agency_detection;
  const confidence = detection?.same_property_confidence ?? null;
  const base = { key: "multi_agency", label: "Multi-agência", confidence, icon: Building2 };

  // O rótulo vem sempre de multiAgencyLevel — a mesma função que o filtro usa.
  switch (multiAgencyLevel(lead)) {
    case "confirmed": {
      const matched = matchedAgencies(lead);
      return {
        ...base,
        value:
          matched.length > 0
            ? `${multiAgencyLevelLabel("confirmed")} · ${matched.length} agência${matched.length > 1 ? "s" : ""}`
            : (multiAgencyLevelLabel("confirmed") ?? ""),
        tone: polarityTone("warning"),
        detail: matched.length > 0 ? matched.join(", ") : reasonsDetail(lead),
      };
    }
    case "probable": {
      const origin = probableOrigin(lead);
      return {
        ...base,
        value: origin ? `${multiAgencyLevelLabel("probable")} · ${origin}` : (multiAgencyLevelLabel("probable") ?? ""),
        tone: polarityTone("warning"),
        detail: reasonsDetail(lead),
      };
    }
    case "unlikely":
      return {
        ...base,
        value: multiAgencyLevelLabel("unlikely") ?? "",
        tone: polarityTone("neutral"),
        detail: reasonsDetail(lead),
      };
    case "unknown":
      // "skipped" significa que não se verificou nada — dizer "não" seria mentir.
      if (detection?.status === "insufficient_evidence") {
        return {
          ...base,
          value: "Sem indícios",
          tone: polarityTone("neutral"),
          detail: multiAgencyStatusLabel(detection.status),
        };
      }
      return null;
  }
}

function furnitureFact(lead: Lead): HeadlineFact | null {
  const status = lead.visual_assessment?.furniture_status;
  const label = furnitureStatusLabel(status);
  if (!label || status === "unclear") return null;
  const tone: Polarity = status === "furnished" ? "neutral" : "neutral";
  return {
    key: "furniture",
    label: "Mobília",
    value: label,
    tone: polarityTone(tone),
    confidence: null,
    icon: Sofa,
  };
}

function occupancyFact(lead: Lead): HeadlineFact | null {
  const cues = lead.visual_assessment?.occupancy_cues;
  const label = occupancyLabel(cues);
  if (!label || cues === "unclear") return null;
  const tone: Polarity = cues === "vacant" ? "positive" : cues === "lived_in" ? "warning" : "neutral";
  return {
    key: "occupancy",
    label: "Ocupação",
    value: label,
    tone: polarityTone(tone),
    confidence: null,
    icon: DoorOpen,
  };
}

function newConstructionFact(lead: Lead): HeadlineFact | null {
  // Só vale a pena mostrar quando É construção nova — "não é nova" é o
  // caso comum (10/10 leads actuais) e seria ruído.
  if (lead.property.is_new_development !== true) return null;
  return {
    key: "new_development",
    label: "Construção",
    value: "Nova construção",
    tone: polarityTone("positive"),
    confidence: null,
    icon: Hammer,
  };
}

function agencyFact(lead: Lead): HeadlineFact | null {
  if (!lead.seller.agency_name) return null;
  return {
    key: "agency",
    label: "Agência",
    value: lead.seller.agency_name,
    tone: polarityTone("neutral"),
    confidence: null,
    icon: Building2,
    detail: sellerDisplayName(lead.seller),
  };
}

function luxuryTierFact(lead: Lead): HeadlineFact | null {
  const tier = lead.property_intelligence?.luxury_tier;
  const label = luxuryTierLabel(tier);
  if (!label) return null;
  return {
    key: "luxury_tier",
    label: "Segmento",
    value: label,
    tone: polarityTone(tier === "luxury" ? "positive" : "neutral"),
    confidence: null,
    icon: Gem,
  };
}

function conditionFact(lead: Lead): HeadlineFact | null {
  const raw =
    lead.property_intelligence?.condition ?? lead.visual_assessment?.overall_condition;
  const label = conditionLabel(raw) ?? (raw && raw !== "unclear" ? raw : null);
  if (!label) return null;
  const tone: Polarity =
    raw === "excellent" || raw === "good" ? "positive" : raw === "poor" ? "negative" : "neutral";
  return {
    key: "condition",
    label: "Condição",
    value: label,
    tone: polarityTone(tone),
    confidence: null,
    icon: ShieldCheck,
  };
}

const MAX_FACTS = 6;

export function leadHeadlineFacts(lead: Lead): HeadlineFact[] {
  const facts = [
    multiAgencyFact(lead),
    furnitureFact(lead),
    occupancyFact(lead),
    newConstructionFact(lead),
    agencyFact(lead),
    luxuryTierFact(lead),
    conditionFact(lead),
  ].filter((fact): fact is HeadlineFact => fact != null);

  return facts.slice(0, MAX_FACTS);
}
