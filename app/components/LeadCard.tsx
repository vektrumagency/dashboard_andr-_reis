"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lead, Property } from "@/lib/types";
import {
  formatArea,
  formatPrice,
  formatPricePerSqm,
  formatSignedEuroPerSqm,
  formatSignedPercent,
} from "@/lib/format";
import { PRIORITY_LABELS, formatMarketConfidence, formatMarketPosition } from "@/lib/leads";
import { zoneTier } from "@/lib/zones";
import { priorityAccent } from "@/lib/priorityAccent";
import { scoreColor } from "@/lib/scoreColor";
import { signalPolarity } from "@/lib/signals";
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

export function LeadCard({ lead, nextId = null }: { lead: Lead; nextId?: string | null }) {
  const router = useRouter();
  const { updateStatus } = useLeads();
  const [isExiting, setIsExiting] = useState(false);
  const accent = priorityAccent(lead.priority);
  const { property, seller, ai_note } = lead;
  const positiveSignals = lead.signals.filter((signal) => signalPolarity(signal) === "positive");
  const negativeSignals = lead.signals.filter((signal) => signalPolarity(signal) === "negative");
  const neutralSignals = lead.signals.filter((signal) => signalPolarity(signal) === "neutral");

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
            </p>
            <h2 className="text-xl font-semibold text-zinc-900">
              {property.zone} · {property.typology}
            </h2>
            {property.micro_zone && (
              <p className="text-sm text-zinc-500">{property.micro_zone}</p>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border border-current/30 px-3 py-1 text-xs font-bold uppercase tracking-widest ${accent.text}`}
        >
          {PRIORITY_LABELS[lead.priority]}
        </span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:divide-x lg:divide-zinc-200">
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
            />
            <Stat label="Área" value={formatArea(property.area_sqm)} />
            <Stat label="Dias no mercado" value={String(property.days_on_market ?? "—")} />
            <div className="col-span-2">
              <PricePerSqmComparison property={property} />
            </div>
            <div className="col-span-2">
              <FurnishedTag furnished={property.furnished} />
            </div>
          </div>

          {lead.signals.length > 0 && (
            <div className="flex flex-col gap-2 px-6 pb-5">
              {positiveSignals.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {positiveSignals.map((signal) => (
                    <span
                      key={signal}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] uppercase tracking-wide text-emerald-700"
                    >
                      <span className="text-emerald-500">◆</span>
                      {signal.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
              {negativeSignals.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {negativeSignals.map((signal) => (
                    <span
                      key={signal}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] uppercase tracking-wide text-red-700"
                    >
                      <span className="text-red-500">▲</span>
                      {signal.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-auto border-t border-zinc-200 px-6 py-5">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              Vendedor
            </p>
            <p className="text-sm text-zinc-700">
              {SELLER_LABELS[seller.type]}
              {seller.agency_name ? ` · ${seller.agency_name}` : ""}
              {seller.name ? ` · ${seller.name}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-col border-t border-zinc-200 bg-zinc-50/60 lg:border-t-0">
          <div className="flex flex-1 flex-col gap-4 px-6 py-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">Briefing</p>

            {ai_note.diagnosis && <Note label="Diagnóstico" text={ai_note.diagnosis} />}
            {ai_note.owner_reading && <Note label="Leitura do proprietário" text={ai_note.owner_reading} />}
            {ai_note.entry_angle && <Note label="Ângulo de entrada" text={ai_note.entry_angle} />}

            {ai_note.next_action && (
              <div className="rounded-lg bg-zinc-100 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Próxima ação
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900">{ai_note.next_action}</p>
              </div>
            )}

            <ContactChannel lead={lead} />

            {lead.manual_notes && (
              <div className="rounded-lg bg-zinc-100 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Notas (André)
                </p>
                <p className="mt-1 text-sm text-zinc-700">{lead.manual_notes}</p>
              </div>
            )}
          </div>

          {property.listing_url && (
            <div className="border-t border-zinc-200 px-6 py-4">
              <a
                href={property.listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium ${accent.text} hover:bg-zinc-50`}
              >
                Ver anúncio original ↗
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-200">
        <LeadActionBar status={lead.status} disabled={isExiting} onDecide={handleDecide} />
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-zinc-100 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`font-mono text-base ${highlight ? "text-zinc-900" : "text-zinc-700"}`}>{value}</p>
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
    market_reference_confidence,
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
