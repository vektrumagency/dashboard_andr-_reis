/**
 * Forma alinhada com os models reais do backend (`agents/lead-researcher`,
 * Pydantic). Confirmado por leitura direta do código do Luís — ver
 * app/models/lead.py e app/models/market.py nesse projeto.
 *
 * A camada de análise mais rica (commercial_briefing, visual_assessment,
 * property_intelligence, etc.) vive em ./types/analysis — separada porque
 * são objectos profundamente aninhados e misturá-los aqui tornaria este
 * ficheiro difícil de ler.
 */
import {
  CommercialBriefing,
  LocationIntelligence,
  MarketAdjustment,
  MultiAgencyDetection,
  PropertyIdentity,
  PropertyIntelligence,
  QualitativeFactor,
  ResearchMeta,
  VisualAssessment,
  VisualAuthenticityShadow,
} from "./types/analysis";

export type MarketId = "cascais" | "belem_restelo" | "alges_arredores";

export type LeadStatus = "new" | "saved" | "contacted" | "visit" | "locating" | "not_relevant";

export type LeadPriority = "high" | "medium" | "low" | "exclude";

export type SellerType = "private" | "agency" | "promoter" | "unknown";

export type SourcePortal = "idealista" | "imovirtual" | "olx" | "casa_sapo" | "unknown";

export interface Property {
  title: string | null;
  zone: string | null;
  micro_zone: string | null;
  typology: string | null;
  property_type: string | null;
  price_current: number | null;
  price_initial: number | null;
  price_reduction_amount: number | null;
  price_reduction_pct: number | null;
  area_sqm: number | null;
  price_per_sqm: number | null;
  furnished: boolean | null;
  days_on_market: number | null;
  listing_url: string | null;
  published_date: string | null;
  lat: number | null;
  lng: number | null;
  images: string[];
  /**
   * Total real de fotos — só vem preenchido em getLeadsList() (vista de
   * lista), onde `images` está reduzido a 1 elemento para poupar payload.
   * Em getLead(id) (documento completo) fica `null`; usar `images.length`
   * nesse caso.
   */
  image_count?: number | null;
  energy_rating?: string | null;
  bathrooms?: number | null;
  floor?: string | null;
  has_elevator?: boolean | null;
  has_parking?: boolean | null;
  has_terrace?: boolean | null;
  has_balcony?: boolean | null;
  has_garden?: boolean | null;
  has_swimming_pool?: boolean | null;
  has_air_conditioning?: boolean | null;
  has_storage_room?: boolean | null;
  has_exterior_facing?: boolean | null;
  has_floor_plan?: boolean | null;
  has_virtual_tour?: boolean | null;
  has_staging?: boolean | null;
  is_new_development?: boolean | null;
  municipality?: string | null;
  /** Como a localização foi obtida — ver o agente de localização (Francisco). */
  location_precision?: string | null;
  location_source?: string | null;
  portal_listing_id?: string | null;
  description?: string | null;
  /**
   * Benchmark de mercado calculado e persistido pelo backend — o frontend
   * só lê estes campos, nunca calcula o benchmark. Opcionais porque nem
   * todos os leads têm este cálculo ainda.
   */
  market_reference_price_per_sqm?: number | null;
  market_reference_zone?: string | null;
  market_reference_basis?: string | null;
  market_reference_confidence?: string | null;
  market_reference_reasoning?: string | null;
  comparable_context_used?: string[] | null;
  price_vs_market_pct?: number | null;
  price_vs_market_amount_per_sqm?: number | null;
  price_market_position?: string | null;
  price_market_commentary?: string | null;
  /**
   * Banda de referência alargada — base vs ajustada, e onde este anúncio cai
   * dentro dela. Confirmado 10/10 preenchido na Mongo real (2026-07-27).
   * Usar lib/derive/priceBand.ts para transformar isto num modelo visual,
   * não calcular posições directamente nos componentes.
   */
  market_base_reference_price_per_sqm?: number | null;
  market_reference_range_low_per_sqm?: number | null;
  market_reference_range_high_per_sqm?: number | null;
  market_reference_adjusted_per_sqm?: number | null;
  market_reference_adjusted_low_per_sqm?: number | null;
  market_reference_adjusted_high_per_sqm?: number | null;
  market_reference_total_adjustment_low_percent?: number | null;
  market_reference_total_adjustment_high_percent?: number | null;
  market_reference_match_level?: string | null;
  market_reference_top_band_label?: string | null;
  price_vs_base_market_pct?: number | null;
  price_band_position?: string | null;
  price_asks_into_top_band?: boolean | null;
  market_reference_adjustments?: MarketAdjustment[];
  market_amenity_adjustments?: MarketAdjustment[];
  market_reference_qualitative_factors?: QualitativeFactor[];
  market_benchmark_limitations?: string[];
}

export interface Seller {
  type: SellerType;
  name: string | null;
  agency_name: string | null;
  phone: string | null;
  email: string | null;
  contact_source: string | null;
}

export interface AINote {
  diagnosis: string | null;
  owner_reading: string | null;
  entry_angle: string | null;
  next_action: string | null;
  suggested_message: string | null;
}

export interface PriceSnapshot {
  price: number | null;
  seen_at: string;
  source: SourcePortal;
}

export type LocalizationConfidence = "high" | "medium" | "low";

export interface LocalizationAnswer {
  formatted_address: string;
  street: string | null;
  door_number: string | null;
  postal_code: string | null;
  locality: string | null;
  municipality: string | null;
  latitude: number | null;
  longitude: number | null;
  confidence: LocalizationConfidence;
  explanation: string | null;
  answered_by: string;
}

export interface LocalizationCase {
  request_id: string;
  status: "processing" | "answered";
  requested_at: string;
  updated_at: string;
  answered_at: string | null;
  previous_lead_status: Exclude<LeadStatus, "locating">;
  answer: LocalizationAnswer | null;
}

export interface Lead {
  id: string;
  market: MarketId;
  source: SourcePortal;
  status: LeadStatus;
  priority: LeadPriority;
  score: number;
  property: Property;
  seller: Seller;
  signals: string[];
  ai_note: AINote;
  /**
   * Mensagem de outreach personalizada gerada pelo agente (separada do
   * ai_note "clássico"). Campos opcionais — leads antigos ou ainda por
   * processar podem não os ter.
   */
  outreach_message?: string | null;
  outreach_message_subject?: string | null;
  outreach_angle?: string | null;
  /**
   * Array na Mongo real (confirmado 2026-07-27), não string — um bug de
   * tipo aqui fazia o React concatenar as notas sem separador ("Moradia
   * no ResteloJardim maduro..."), visível em ContactChannel e
   * OutreachQueue antes desta correcção.
   */
  outreach_personalization_notes?: string[] | null;
  outreach_message_generated_at?: string | null;
  outreach_message_version?: number | null;
  outreach_message_status?: string | null;
  localization_case?: LocalizationCase | null;
  manual_notes: string | null;
  /** Explica porque um lead que ainda não avançou para outreach vale continuar a acompanhar. */
  monitor_reason?: string | null;
  price_history: PriceSnapshot[];
  created_at: string;
  updated_at: string;
  /**
   * Camada de análise mais recente — confirmada 10/10 preenchida na Mongo
   * real (2026-07-27), ao contrário de `ai_note` (0/10). É a base do card
   * de detalhe redesenhado; ver lib/derive/briefing.ts e headlineFacts.ts.
   *
   * Todos estes campos são irmãos de `property` no documento Mongo, NÃO
   * aninhados dentro dele — confirmado por leitura directa de um documento
   * real (`Object.keys(doc)` inclui `property_intelligence`,
   * `location_intelligence`, etc. ao mesmo nível que `property`).
   */
  commercial_briefing?: CommercialBriefing | null;
  visual_assessment?: VisualAssessment | null;
  visual_authenticity_shadow?: VisualAuthenticityShadow | null;
  property_intelligence?: PropertyIntelligence | null;
  location_intelligence?: LocationIntelligence | null;
  multi_agency_detection?: MultiAgencyDetection | null;
  research_meta?: ResearchMeta | null;
  property_identity?: PropertyIdentity | null;
}
