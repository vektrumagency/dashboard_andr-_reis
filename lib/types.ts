/**
 * Forma alinhada com os models reais do backend (`agents/lead-researcher`,
 * Pydantic). Confirmado por leitura direta do código do Luís — ver
 * app/models/lead.py e app/models/market.py nesse projeto.
 */

export type MarketId = "cascais" | "alges_arredores";

export type LeadStatus = "new" | "saved" | "contacted" | "visit" | "not_relevant";

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
  days_on_market: number | null;
  listing_url: string | null;
  published_date: string | null;
  lat: number | null;
  lng: number | null;
  images: string[];
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
  manual_notes: string | null;
  price_history: PriceSnapshot[];
  created_at: string;
  updated_at: string;
}
