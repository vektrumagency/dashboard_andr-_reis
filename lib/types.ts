/**
 * Forma alinhada com os models reais do backend (`agents/lead-researcher`,
 * Pydantic). Confirmado por leitura direta do código do Luís — ver
 * app/models/lead.py e app/models/market.py nesse projeto.
 */

export type MarketId = "cascais" | "alges_arredores";

export type LeadStatus = "new" | "contacted" | "visit" | "not_relevant";

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
  outreach_personalization_notes?: string | null;
  outreach_message_generated_at?: string | null;
  outreach_message_version?: number | null;
  outreach_message_status?: string | null;
  manual_notes: string | null;
  /** Explica porque um lead que ainda não avançou para outreach vale continuar a acompanhar. */
  monitor_reason?: string | null;
  price_history: PriceSnapshot[];
  created_at: string;
  updated_at: string;
}
