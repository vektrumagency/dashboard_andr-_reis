export const RECRUITMENT_STAGES = [
  "new", "contacted", "follow_up", "in_conversation", "meeting_scheduled",
  "meeting_done", "deciding", "joined", "not_now", "not_interested", "opted_out",
] as const;

export type RecruitmentStage = (typeof RECRUITMENT_STAGES)[number];
export type RecruitmentPriority = "A" | "B" | "C" | "Exclude";
export type RecruitmentTab = "outreach" | "enrichment" | "rejected";

export const RECRUITMENT_STAGE_LABELS: Record<RecruitmentStage, string> = {
  new: "Novo",
  contacted: "Contactado",
  follow_up: "Follow-up",
  in_conversation: "Em conversa",
  meeting_scheduled: "Reunião marcada",
  meeting_done: "Reunião feita",
  deciding: "Em decisão",
  joined: "Entrou na equipa",
  not_now: "Mais tarde",
  not_interested: "Sem interesse",
  opted_out: "Não contactar",
};

export const RECRUITMENT_SEGMENT_LABELS: Record<string, string> = {
  experienced_consultant: "Consultor imobiliário experiente",
  independent_real_estate: "Profissional imobiliário independente",
  adjacent_property_professional: "Profissional ligado ao imobiliário",
  final_year_student: "Estudante finalista",
  recent_graduate: "Recém-formado",
  sales_business_development: "Vendas e desenvolvimento de negócio",
  client_facing_professional: "Profissional de atendimento ao cliente",
  entrepreneur_self_employed: "Empreendedor ou trabalhador independente",
};

export function recruitmentSegmentLabel(segment: string): string {
  return RECRUITMENT_SEGMENT_LABELS[segment] ?? segment.replaceAll("_", " ");
}

export function isRecruitmentStage(value: unknown): value is RecruitmentStage {
  return typeof value === "string" && RECRUITMENT_STAGES.includes(value as RecruitmentStage);
}

export interface RecruitmentStageEvent {
  stage: RecruitmentStage;
  changed_at: string;
  note?: string;
  recontact_at?: string | null;
}

export interface RecruitmentListItem {
  id: string;
  full_name: string;
  email: string | null;
  linkedin_url: string | null;
  professional_role: string | null;
  current_affiliation: string | null;
  geographic_area: string | null;
  segment: string;
  status: "qualified" | "rejected";
  priority: RecruitmentPriority;
  score_total: number;
  lead_completeness: "complete" | "needs_enrichment";
  missing_fields: string[];
  email_origin: "public_source" | "enrichment_provider" | null;
  funnel_stage: RecruitmentStage;
  stage_updated_at: string | null;
  stage_note: string | null;
  recontact_at: string | null;
  updated_at: string;
}

export interface RecruitmentEvidence {
  observation?: string;
  source_url?: string;
  retrieved?: string;
  relevance?: string;
  label?: string;
}

export interface RecruitmentDetailData extends RecruitmentListItem {
  rationale: string | null;
  rejection_reason: string | null;
  research_date: string | null;
  email_source_url: string | null;
  instagram_url: string | null;
  professional_website: string | null;
  source_urls: string[];
  created_at: string;
  stage_history: RecruitmentStageEvent[];
  candidate: {
    professional_summary?: string;
    experience_summary?: string;
    public_professional_phone?: string;
    known_positive_signals?: string[];
    known_cautions?: string[];
    critical_unknowns?: string[];
    evidence?: RecruitmentEvidence[];
  };
}

export function recruitmentTabFor(item: RecruitmentListItem): RecruitmentTab {
  if (item.status === "rejected") return "rejected";
  return item.lead_completeness === "complete" ? "outreach" : "enrichment";
}
