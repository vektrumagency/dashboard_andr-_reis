"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lead, Property, PriceSnapshot } from "@/lib/types";
import {
  formatArea,
  formatDate,
  formatPrice,
  formatPricePerSqm,
  formatRelativeTime,
  formatSignedEuroPerSqm,
  formatSignedPercent,
} from "@/lib/format";
import { PRIORITY_LABELS, formatMarketConfidence, formatMarketPosition } from "@/lib/leads";
import { zoneTier } from "@/lib/zones";
import { priorityAccent } from "@/lib/priorityAccent";
import { scoreColor } from "@/lib/scoreColor";
import { useLeads } from "@/lib/leadsStore";
import { LeadActionBar } from "./LeadActionBar";
import { ContactChannel } from "./ContactChannel";
import { PhotoCarousel } from "./PhotoCarousel";

const EXIT_ANIMATION_MS = 250;

const SELLER_LABELS: Record<Lead["seller"]["type"], string> = {
  private: "Particular",
  agency: "Agência",
  promoter: "Promotor",
  unknown: "Desconhecido",
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: "Moradia",
  apartment: "Apartamento",
};

const LOCATION_PRECISION_LABELS: Record<string, string> = {
  exact: "localização exata",
  street: "rua confirmada",
  approximate_zone: "zona aproximada",
};

const AMENITIES: { key: keyof Property; label: string }[] = [
  { key: "has_swimming_pool", label: "Piscina" },
  { key: "has_garden", label: "Jardim" },
  { key: "has_parking", label: "Garagem/Estacionamento" },
  { key: "has_elevator", label: "Elevador" },
  { key: "has_terrace", label: "Terraço" },
  { key: "has_balcony", label: "Varanda" },
  { key: "has_air_conditioning", label: "Ar condicionado" },
  { key: "has_storage_room", label: "Arrecadação" },
  { key: "has_exterior_facing", label: "Exterior" },
  { key: "has_floor_plan", label: "Planta disponível" },
  { key: "has_virtual_tour", label: "Tour virtual" },
  { key: "has_staging", label: "Home staging" },
];

export function LeadCard({ lead, nextId = null }: { lead: Lead; nextId?: string | null }) {
  const router = useRouter();
  const { updateStatus } = useLeads();
  const [isExiting, setIsExiting] = useState(false);
  const accent = priorityAccent(lead.priority);
  const { property, seller, ai_note } = lead;
  const activeAmenities = AMENITIES.filter((a) => property[a.key] === true);

  function handleDecide(stage: Lead["status"]) {
    setIsExiting(true);
    updateStatus(lead.id, stage);
    setTimeout(() => {
      router.replace(nextId ? `/leads/${nextId}` : "/");
    }, EXIT_ANIMATION_MS);
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 ${
        isExiting ? "lead-card-exit" : ""
      }`}
    >
      <PhotoCarousel images={property.images} alt={property.title ?? `${property.zone} · ${property.typology}`} />

      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 border-zinc-200 bg-zinc-50 font-mono"
          >
            <span className={`text-xl font-bold leading-none ${scoreColor(lead.score)}`}>{lead.score}</span>
            <span className="text-[9px] uppercase tracking-widest text-zinc-500">score</span>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              Lead · {lead.id}
              {zoneTier(property.zone) != null ? ` · Tier ${zoneTier(property.zone)}` : ""}
              {property.municipality ? ` · ${property.municipality}` : ""}
            </p>
            <h2 className="text-xl font-semibold text-zinc-900">
              {property.zone} · {property.typology}
            </h2>
            {(property.micro_zone || property.property_type) && (
              <p className="text-sm text-zinc-500">
                {[
                  property.micro_zone,
                  property.property_type
                    ? PROPERTY_TYPE_LABELS[property.property_type] ?? property.property_type
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <p className="mt-1 text-[11px] text-zinc-400">
              Criado {formatRelativeTime(lead.created_at)} · Atualizado {formatRelativeTime(lead.updated_at)}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border border-current/30 px-3 py-1 text-xs font-bold uppercase tracking-widest ${accent.text}`}
        >
          {PRIORITY_LABELS[lead.priority]}
        </span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:divide-x lg:divide-zinc-200">
        <div className="flex flex-col">
          <div className="grid grid-cols-2 gap-3 px-6 pt-5 pb-5">
            <Stat label="Preço" value={formatPrice(property.price_current)} highlight />
            <Stat
              label="Redução"
              value={
                property.price_reduction_pct && property.price_reduction_pct > 0
                  ? `-${Math.round(property.price_reduction_pct)}%`
                  : "—"
              }
              sub={
                property.price_reduction_amount && property.price_reduction_amount > 0
                  ? `-${formatPrice(property.price_reduction_amount)} · de ${formatPrice(property.price_initial)}`
                  : undefined
              }
            />
            <Stat label="Área" value={formatArea(property.area_sqm)} />
            <Stat
              label="Dias no mercado"
              value={String(property.days_on_market ?? "—")}
              sub={property.published_date ? `publicado ${formatDate(property.published_date)}` : undefined}
            />
            {property.bathrooms != null && <Stat label="Casas de banho" value={String(property.bathrooms)} />}
            {property.floor && <Stat label="Andar" value={property.floor} />}
            {property.energy_rating && (
              <Stat label="Certificado energético" value={property.energy_rating} />
            )}
            <div className="col-span-2">
              <PricePerSqmComparison property={property} />
            </div>
            {(activeAmenities.length > 0 || property.is_new_development || property.furnished !== null) && (
              <div className="col-span-2 flex flex-wrap gap-2">
                <FurnishedTag furnished={property.furnished} />
                {property.is_new_development && <Chip label="Construção nova" />}
                {activeAmenities.map((a) => (
                  <Chip key={a.key} label={a.label} />
                ))}
              </div>
            )}
          </div>

          <div className="px-6 pb-5">
            <PriceHistoryList history={lead.price_history} />
          </div>

          {property.description && (
            <div className="px-6 pb-5">
              <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Descrição do anúncio</p>
              <p className="text-sm leading-relaxed text-zinc-600">{property.description}</p>
            </div>
          )}

          <div className="px-6 pb-5">
            <ContactChannel lead={lead} />
          </div>

          <div className="mt-auto border-t border-zinc-200 px-6 py-5">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              Vendedor
            </p>
            <p className="text-sm text-zinc-700">
              {SELLER_LABELS[seller.type]}
              {seller.agency_name ? ` · ${seller.agency_name}` : ""}
              {seller.name ? ` · ${seller.name}` : ""}
              {seller.contact_source ? ` · via ${seller.contact_source}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-col border-t border-zinc-200 bg-zinc-50/60 lg:border-t-0">
          <div className="flex flex-1 flex-col gap-4 px-6 py-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">Briefing</p>

            {ai_note.diagnosis && <Note label="Diagnóstico" text={ai_note.diagnosis} />}
            {ai_note.owner_reading && <Note label="Leitura do proprietário" text={ai_note.owner_reading} />}
            {ai_note.entry_angle && <Note label="Ângulo de entrada" text={ai_note.entry_angle} />}
            {ai_note.suggested_message && (
              <Note label="Sugestão de abordagem (IA)" text={ai_note.suggested_message} />
            )}

            {ai_note.next_action && (
              <div className="rounded-lg bg-zinc-100 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Próxima ação
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900">{ai_note.next_action}</p>
              </div>
            )}

            {lead.monitor_reason && (
              <div className="rounded-lg bg-amber-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                  Motivo de monitorização
                </p>
                <p className="mt-1 text-sm text-amber-900">{lead.monitor_reason}</p>
              </div>
            )}

            {lead.manual_notes && (
              <div className="rounded-lg bg-zinc-100 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Notas (André)
                </p>
                <p className="mt-1 text-sm text-zinc-700">{lead.manual_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {(property.listing_url || (property.lat != null && property.lng != null)) && (
        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 px-6 py-4">
          {property.listing_url && (
            <a
              href={property.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium ${accent.text} hover:bg-zinc-50`}
            >
              Ver anúncio original ↗
            </a>
          )}
          {property.lat != null && property.lng != null && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Ver no Google Maps ↗
            </a>
          )}
          {property.location_precision && LOCATION_PRECISION_LABELS[property.location_precision] && (
            <span className="text-[11px] text-zinc-400">
              ({LOCATION_PRECISION_LABELS[property.location_precision]})
            </span>
          )}
          {property.portal_listing_id && (
            <span className="ml-auto text-[11px] text-zinc-400">ID anúncio: {property.portal_listing_id}</span>
          )}
        </div>
      )}

      <div className="border-t border-zinc-200">
        <LeadActionBar status={lead.status} disabled={isExiting} onDecide={handleDecide} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-zinc-100 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`font-mono text-base ${highlight ? "text-zinc-900" : "text-zinc-700"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-zinc-400">{sub}</p>}
    </div>
  );
}

function Note({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm leading-relaxed text-zinc-700">{text}</p>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
      ✓ {label}
    </span>
  );
}

const MARKET_POSITION_COLOR: Record<string, string> = {
  below_market: "text-emerald-600",
  above_market: "text-red-600",
  around_market: "text-zinc-600",
};

function PricePerSqmComparison({ property }: { property: Property }) {
  const {
    price_per_sqm,
    market_reference_price_per_sqm,
    market_reference_zone,
    market_reference_basis,
    market_reference_confidence,
    market_reference_reasoning,
    comparable_context_used,
    price_vs_market_pct,
    price_vs_market_amount_per_sqm,
    price_market_position,
    price_market_commentary,
  } = property;

  const positionColor =
    (price_market_position && MARKET_POSITION_COLOR[price_market_position]) || "text-zinc-400";

  return (
    <div className="rounded-lg bg-zinc-100 px-3 py-2.5">
      <p className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500">€/m² — imóvel vs zona</p>
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-400">Imóvel</span>
          <span className="font-mono text-sm font-semibold text-zinc-900">
            {formatPricePerSqm(price_per_sqm)}
          </span>
        </div>
        <span className="text-zinc-300">vs</span>
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-400">
            Zona (ref.){market_reference_zone ? ` · ${market_reference_zone}` : ""}
          </span>
          <span className="font-mono text-sm text-zinc-600">
            {market_reference_price_per_sqm != null
              ? formatPricePerSqm(market_reference_price_per_sqm)
              : "Sem referência"}
          </span>
        </div>
        {price_vs_market_pct != null && (
          <span className={`ml-auto font-mono text-sm font-bold ${positionColor}`}>
            {formatSignedPercent(price_vs_market_pct)}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
        <span className={`font-medium ${positionColor}`}>{formatMarketPosition(price_market_position)}</span>
        {market_reference_confidence && (
          <span className="text-zinc-500">· {formatMarketConfidence(market_reference_confidence)}</span>
        )}
        {price_vs_market_amount_per_sqm != null && (
          <span className="text-zinc-500">· {formatSignedEuroPerSqm(price_vs_market_amount_per_sqm)}</span>
        )}
      </div>

      {price_market_commentary && (
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">{price_market_commentary}</p>
      )}
      {market_reference_basis && (
        <p className="mt-1 text-[11px] text-zinc-500">Base: {market_reference_basis}</p>
      )}
      {market_reference_reasoning && (
        <p className="mt-1 text-xs italic leading-relaxed text-zinc-500">{market_reference_reasoning}</p>
      )}
      {comparable_context_used && comparable_context_used.length > 0 && (
        <p className="mt-1 text-[11px] text-zinc-400">Comparáveis: {comparable_context_used.join(", ")}</p>
      )}
    </div>
  );
}

function PriceHistoryList({ history }: { history: PriceSnapshot[] }) {
  if (!history || history.length === 0) return null;
  const sorted = [...history].sort(
    (a, b) => new Date(b.seen_at).getTime() - new Date(a.seen_at).getTime(),
  );
  return (
    <div className="rounded-lg bg-zinc-100 px-3 py-2.5">
      <p className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500">Histórico de preço</p>
      <ul className="flex flex-col gap-1">
        {sorted.map((snap, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="font-mono text-zinc-700">{formatPrice(snap.price)}</span>
            <span className="text-xs text-zinc-400">
              {formatDate(snap.seen_at)} · {snap.source}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FurnishedTag({ furnished }: { furnished: boolean | null }) {
  if (furnished === null) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${
        furnished
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-zinc-200 bg-zinc-50 text-zinc-500"
      }`}
    >
      {furnished ? "⌂ Mobilado" : "⌂ Sem mobilar"}
    </span>
  );
}
