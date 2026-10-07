export const PARTNER_STAGES = ["new", "contacted", "engaged", "closed_won", "closed_lost", "closed_on_hold"] as const;
export type PartnerStage = (typeof PARTNER_STAGES)[number];
export type PartnerPriority = "A" | "B" | "C" | "Exclude";

export const PARTNER_STAGE_LABELS: Record<PartnerStage, string> = {
  new: "Lead",
  contacted: "Contactado",
  engaged: "Envolvido",
  closed_won: "Fechado ganho",
  closed_lost: "Fechado perdido",
  closed_on_hold: "Fechado em espera",
};

export const PARTNER_SEGMENT_LABELS: Record<string, string> = {
  condominium_management: "Gestão de condomínios",
  owner_property_management: "Gestão de imóveis",
  mortgage_credit: "Crédito habitação",
  relocation_expat: "Relocation / expatriados",
  legal_tax_private_client: "Jurídico e fiscal",
};

export function segmentLabel(segment: string): string {
  return PARTNER_SEGMENT_LABELS[segment] ?? segment.replaceAll("_", " ");
}

export function isPartnerStage(value: unknown): value is PartnerStage {
  return typeof value === "string" && PARTNER_STAGES.includes(value as PartnerStage);
}

export interface PartnerListItem {
  id: string;
  company_name: string;
  company_domain?: string | null;
  segment: string;
  status: "qualified";
  priority: PartnerPriority;
  score_total: number;
  funnel_stage: PartnerStage;
  contact: {
    name?: string | null;
    role?: string | null;
    business_email?: string | null;
    telephone?: string | null;
  };
  updated_at: string;
}

export interface PartnerEvidence {
  observation?: string;
  source_url?: string;
  retrieved?: string;
  relevance?: string;
  label?: string;
}

export interface PartnerDetailData extends PartnerListItem {
  website?: string | null;
  rationale?: string | null;
  created_at: string;
  candidate: {
    company?: { business_summary?: string; office_location?: string };
    message_angle?: string;
    value_proposition?: string;
    meeting_question?: string;
    evidence?: PartnerEvidence[];
    known_positive_signals?: string[];
    known_cautions?: string[];
    critical_unknowns?: string[];
  };
}
