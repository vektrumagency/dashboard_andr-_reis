/**
 * Formas da camada de análise produzida pelo agente do Luís
 * (`lead-researcher`, Python/Pydantic) — confirmadas por leitura directa de
 * documentos reais na Mongo (`andre_reis_leads.leads`, 2026-07-27), não a
 * partir de um schema partilhado. Tal como lib/types.ts, isto é uma cópia
 * mantida à mão de um repo de outra pessoa: DEVE ficar permissiva.
 *
 * Regra: strings "enum" ganham uma união de literais conhecidos + `(string
 * & {})` como escape hatch — mantém autocomplete sem rebentar quando o
 * backend introduzir um valor novo. Tudo é opcional/nullable: a cobertura
 * de campos na BD real é muito desigual (ver lib/derive/*), e um tipo
 * estrito aqui só trocaria "undefined em runtime" por "TS a mentir sobre
 * uma garantia que a BD não dá".
 */

type Loose<T extends string> = T | (string & {});
type Level = Loose<"high" | "medium" | "low" | "unknown">;

// ---------------------------------------------------------------------------
// commercial_briefing — substitui o extinto ai_note (0/10 preenchido)
// ---------------------------------------------------------------------------

export interface BulletEvidence {
  source?: string | null;
  reference?: string | null;
  summary?: string | null;
  value?: unknown;
}

export interface CommercialBullet {
  code: Loose<
    | "below_market"
    | "above_market"
    | "missing_expected_features"
    | "benchmark_credited_amenities"
    | "missing_floor_plan"
    | "visible_condition_risks"
    | "virtual_staging"
    | "probable_occupancy"
    | "probable_vacancy"
    | "benchmark_limited"
  >;
  text: string;
  category?: Loose<"pricing" | "amenity" | "presentation" | "risk" | "visual"> | null;
  polarity?: Loose<"positive" | "negative" | "warning" | "neutral"> | null;
  basis?: Loose<"derived" | "probabilistic" | "fact"> | null;
  confidence?: Level | null;
  evidence?: BulletEvidence[];
}

export interface InterpretationItem {
  text: string;
  confidence?: Level | null;
  snapshot_bullet_ids?: string[];
  category?: string | null;
}

export interface FirstCallQuestion {
  question: string;
  purpose?: string | null;
  snapshot_bullet_ids?: string[];
}

export interface CommercialBriefing {
  schema_version?: string | null;
  generator_version?: string | null;
  generated_at?: string | null;
  source_fingerprint?: string | null;
  status?: Loose<"generated" | "failed" | "pending"> | null;
  commercial_snapshot?: {
    snapshot_version?: string | null;
    source_fingerprint?: string | null;
    bullets?: CommercialBullet[];
  } | null;
  interpretation?: {
    owner_reading?: InterpretationItem[];
    why_good_lead?: InterpretationItem[];
    commercial_meaning?: InterpretationItem[];
    approach_angle?: InterpretationItem[];
    first_call_questions?: FirstCallQuestion[];
    interpretive_uncertainties?: InterpretationItem[];
  } | null;
}

// ---------------------------------------------------------------------------
// visual_assessment + visual_authenticity_shadow — mobília, ocupação,
// condição, e quais fotos são renders vs fotografia real
// ---------------------------------------------------------------------------

export type FurnitureStatus = Loose<
  "furnished" | "empty" | "partially_furnished" | "unclear"
>;
export type OccupancyCues = Loose<"lived_in" | "vacant" | "staged" | "unclear">;
export type OverallCondition = Loose<"excellent" | "good" | "fair" | "poor" | "unclear">;

export interface ValueFactorObservation {
  factor: string;
  status?: string | null;
  detected_value?: unknown;
  confidence?: Level | null;
  evidence?: string[];
  reasoning?: string | null;
}

export interface VisualAssessment {
  furniture_status?: FurnitureStatus | null;
  occupancy_cues?: OccupancyCues | null;
  overall_condition?: OverallCondition | null;
  suspected_issues?: string[];
  positive_features?: string[];
  evidence?: string[];
  limitations?: string[];
  value_factor_observations?: ValueFactorObservation[];
}

export type ImageOrigin = Loose<"photograph" | "render">;

export interface ImageAssessment {
  gallery_number: number;
  image_id?: string | null;
  image_origin?: ImageOrigin | null;
  confidence?: number | null;
  anomalies?: string[];
  evidence?: string[];
  embedded_disclaimer?: string | null;
  safe_for_physical_property_inference?: boolean | null;
  exclude_from_condition?: boolean | null;
  exclude_from_occupancy?: boolean | null;
  exclude_from_furnishing?: boolean | null;
  exclude_from_amenities?: boolean | null;
  exclude_from_property_matching?: boolean | null;
}

export interface GalleryAssessment {
  likely_contains_virtual_staging?: boolean | null;
  likely_contains_ai_modified_images?: boolean | null;
  affected_image_ids?: string[];
  reliable_physical_evidence_image_ids?: string[];
  confidence?: number | null;
  contradictions?: string[];
}

export interface VisualAuthenticityShadow {
  schema_version?: string | null;
  mode?: string | null;
  image_assessments?: ImageAssessment[];
  gallery_assessment?: GalleryAssessment | null;
  shadow_filtered_visual_assessment?: VisualAssessment | null;
  counterfactual_signals_removed?: string[];
  counterfactual_score_delta?: number | null;
  validation_downgrades?: string[];
  evaluated_at?: string | null;
}

// ---------------------------------------------------------------------------
// property_intelligence — condição, planta, riscos, luxury tier
// ---------------------------------------------------------------------------

export type LuxuryTier = Loose<"luxury" | "premium" | "standard">;

export interface EvidenceItem {
  claim: string;
  kind?: Loose<"observation" | "inference" | "fact"> | null;
  source?: string | null;
  references?: string[];
  confidence?: Level | null;
}

export interface FloorPlan {
  detected?: boolean | null;
  source_images?: number[];
  rooms?: string[];
  adjacencies?: string[];
  circulation?: string | null;
  zoning?: string | null;
  layout_efficiency?: Loose<"good" | "average" | "poor"> | null;
  limitations?: string[];
  confidence?: Level | null;
}

export interface PropertyIntelligence {
  schema_version?: string | null;
  property_class?: string | null;
  property_subtype?: string | null;
  luxury_tier?: LuxuryTier | null;
  condition?: string | null;
  renovation_scope?: string | null;
  renovation_quality?: string | null;
  construction_quality?: string | null;
  floor_quality?: string | null;
  orientation?: string | null;
  natural_light?: string | null;
  view_quality?: string | null;
  privacy?: string | null;
  noise_exposure?: string | null;
  outdoor_spaces?: string[];
  building_quality?: string | null;
  condominium_quality?: string | null;
  common_areas?: string | null;
  security?: string | null;
  amenities?: string[];
  usable_area_sqm?: number | null;
  gross_area_sqm?: number | null;
  plot_area_sqm?: number | null;
  visible_risks?: string[];
  floor_plan?: FloorPlan | null;
  evidence?: EvidenceItem[];
  contradictions?: string[];
  limitations?: string[];
  confidence?: Level | null;
}

// ---------------------------------------------------------------------------
// location_intelligence
// ---------------------------------------------------------------------------

export interface LocationIntelligence {
  schema_version?: string | null;
  canonical_zone?: string | null;
  canonical_micro_zone?: string | null;
  estimated_street?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  source?: string | null;
  confidence?: Level | null;
  evidence?: string[];
  contradictions?: string[];
  nearby_amenity_distances_m?: Record<string, number>;
}

// ---------------------------------------------------------------------------
// multi_agency_detection — responde directamente à pergunta do André
// ---------------------------------------------------------------------------

export type MultiAgencyStatus = Loose<
  "insufficient_evidence" | "skipped" | "confirmed" | "no_match"
>;

export interface MultiAgencyDetection {
  schema_version?: string | null;
  matcher_version?: string | null;
  status?: MultiAgencyStatus | null;
  reason_code?: Loose<"weak_candidate" | "hard_conflict"> | null;
  confirmation_method?: string | null;
  same_property_confidence?: number | null;
  different_advertiser_confirmed?: boolean | null;
  matched_listing_id?: string | null;
  matched_listing_url?: string | null;
  matched_advertiser_key?: string | null;
  matched_agency?: string | null;
  property_cluster_id?: string | null;
  matched_listing_ids?: string[];
  matched_advertiser_keys?: string[];
  matched_agencies?: string[];
  evidence?: string[];
  llm_comparison_used?: boolean | null;
  llm_assessment?: string | null;
  checked_at?: string | null;
  score_adjustment?: number | null;
}

// ---------------------------------------------------------------------------
// market_reference_adjustments / market_amenity_adjustments / qualitative
// ---------------------------------------------------------------------------

export interface AdjustmentEvidence {
  source?: Loose<"scraper_field" | "vision"> | null;
  reference?: string | null;
  value?: unknown;
}

export interface MarketAdjustment {
  feature: string;
  factor?: string | null;
  listing_status?: string | null;
  status?: Loose<"present" | "absent" | "unknown"> | null;
  detected_value?: unknown;
  evidence?: AdjustmentEvidence[];
  detection_confidence?: Level | null;
  importance?: Loose<"high" | "medium" | "low" | "unknown"> | null;
  treatment?: string | null;
  impact_low_pct?: number | null;
  impact_high_pct?: number | null;
  applied_impact_low_pct?: number | null;
  applied_impact_high_pct?: number | null;
  source_rule?: string | null;
  reasoning?: string | null;
  confidence?: Level | null;
  applied?: boolean | null;
}

export interface QualitativeFactor {
  factor: string;
  status?: Loose<"present" | "absent" | "unknown"> | null;
  detected_value?: unknown;
  evidence?: AdjustmentEvidence[];
  detection_confidence?: Level | null;
  reason?: string | null;
  importance?: Loose<"high" | "medium" | "low" | "unknown"> | null;
  impact_low_pct?: number | null;
  impact_high_pct?: number | null;
}

// ---------------------------------------------------------------------------
// research_meta / property_identity — sobretudo diagnóstico interno
// ---------------------------------------------------------------------------

export interface ResearchMeta {
  weekly_run_id?: string | null;
  apify_run_id?: string | null;
  scored_at?: string | null;
  analyst_base_score?: number | null;
  multi_agency_bonus?: number | null;
  confidence?: Level | null;
}

export interface PropertyIdentity {
  cluster_id?: string | null;
  status?: string | null;
  relationship?: string | null;
  listing_ids?: string[];
  advertiser_keys?: string[];
  agencies?: string[];
  updated_at?: string | null;
}
