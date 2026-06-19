export type Priority = "HIGH" | "MEDIUM" | "LOW";

export type LeadStatus =
  | "Por contactar"
  | "Contactado"
  | "Em negociação"
  | "Fechado";

export type SellerType = "particular" | "agência";

export interface Lead {
  id: string;
  zone: string;
  zone_tier: 1 | 2 | 3;
  typology: string;
  price_current: number;
  price_initial: number;
  area_sqm: number;
  days_on_market: number;
  seller_type: SellerType;
  priority: Priority;
  score: number;
  status: LeadStatus;
  listing_url: string;
  commercial_note: string;
  lat: number;
  lng: number;
}
