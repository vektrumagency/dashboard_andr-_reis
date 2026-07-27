"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Lead, Property } from "@/lib/types";
import { MarketAdjustment, QualitativeFactor } from "@/lib/types/analysis";
import { priceBandModel, priceBandTone } from "@/lib/derive/priceBand";
import { formatDate, formatPrice, formatPricePerSqm, formatSignedPercent } from "@/lib/format";
import { formatMarketConfidence, formatMarketPosition } from "@/lib/leads";
import { importanceLabel } from "@/lib/derive/enums";

/**
 * Substitui a antiga PricePerSqmComparison (parede de texto cinzento) por
 * uma banda visual: onde está a referência de mercado, onde está a
 * referência ajustada por atributos, e onde cai este anúncio — incluindo
 * os casos extremos reais (-66% e bem acima da banda), que o modelo em
 * lib/derive/priceBand.ts trata com clamping para não esmagar a barra.
 */
export function PriceBandPanel({
  property,
  priceHistory,
}: {
  property: Property;
  priceHistory: Lead["price_history"];
}) {
  const model = priceBandModel(property);

  if (!model) {
    return (
      <div className="px-6 py-8 text-sm text-ink-faint">
        Sem referência de mercado disponível para esta zona/segmento.
      </div>
    );
  }

  const tone = priceBandTone(model);

  return (
    <div className="flex flex-col gap-6 px-6 py-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-ink-faint">€/m² do anúncio</p>
          <p className="font-mono text-xl font-semibold text-ink">
            {formatPricePerSqm(property.price_per_sqm)}
          </p>
        </div>
        {model.vsAdjustedPct != null && (
          <span className={`font-mono text-lg font-bold ${tone.text}`}>
            {formatSignedPercent(model.vsAdjustedPct)}
          </span>
        )}
        <span className={`text-sm font-medium ${tone.text}`}>
          {formatMarketPosition(model.position)}
        </span>
      </div>

      <PriceBandTrack model={model} />

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        {property.market_reference_confidence && (
          <span>{formatMarketConfidence(property.market_reference_confidence)}</span>
        )}
        {property.market_reference_basis && <span>Base: {property.market_reference_basis}</span>}
        {model.topBandLabel && (
          <span>
            Banda de topo: {model.topBandLabel}
            {model.asksIntoTopBand ? " · pede dentro da banda de topo" : ""}
          </span>
        )}
      </div>

      {property.price_market_commentary && (
        <p className="text-sm leading-relaxed text-ink-muted">{property.price_market_commentary}</p>
      )}

      <AdjustmentsSection property={property} />

      {priceHistory.length > 1 && <PriceHistoryList history={priceHistory} />}
    </div>
  );
}

function PriceHistoryList({ history }: { history: Lead["price_history"] }) {
  const sorted = [...history].sort(
    (a, b) => new Date(b.seen_at).getTime() - new Date(a.seen_at).getTime(),
  );
  return (
    <div className="border-t border-line pt-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        Histórico de preço
      </p>
      <ul className="flex flex-col gap-1">
        {sorted.map((snap, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="font-mono text-ink-muted">{formatPrice(snap.price)}</span>
            <span className="text-xs text-ink-faint">
              {formatDate(snap.seen_at)} · {snap.source}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PriceBandTrack({ model }: { model: NonNullable<ReturnType<typeof priceBandModel>> }) {
  return (
    <div className="relative h-16 pt-4">
      <div className="relative h-3 w-full rounded-pill bg-surface-sunken">
        {model.base && (
          <div
            className="absolute top-0 h-full rounded-pill bg-neutral-soft"
            style={{ left: `${model.base.lowPos * 100}%`, width: `${(model.base.highPos - model.base.lowPos) * 100}%` }}
            title={`Banda base: ${formatPricePerSqm(model.base.low)} – ${formatPricePerSqm(model.base.high)}`}
          />
        )}
        {model.adjusted && (
          <div
            className="absolute top-0 h-full rounded-pill bg-accent-soft ring-1 ring-inset ring-accent/40"
            style={{
              left: `${model.adjusted.lowPos * 100}%`,
              width: `${(model.adjusted.highPos - model.adjusted.lowPos) * 100}%`,
            }}
            title={`Banda ajustada: ${formatPricePerSqm(model.adjusted.low)} – ${formatPricePerSqm(model.adjusted.high)}`}
          />
        )}
      </div>
      {model.listing && (
        <div
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${model.listing.pos * 100}%` }}
        >
          <span className="whitespace-nowrap font-mono text-[11px] font-semibold text-gold">
            {model.listing.offScale === "low" && <ChevronLeft size={11} className="inline" />}
            {formatPricePerSqm(model.listing.value)}
            {model.listing.offScale === "high" && <ChevronRight size={11} className="inline" />}
          </span>
          <span className="h-5 w-0.5 rounded-full bg-gold" />
        </div>
      )}
    </div>
  );
}

function dedupeAdjustments(a: MarketAdjustment[] = [], b: MarketAdjustment[] = []): MarketAdjustment[] {
  const byFeature = new Map<string, MarketAdjustment>();
  for (const adj of [...a, ...b]) {
    if (!byFeature.has(adj.feature)) byFeature.set(adj.feature, adj);
  }
  return Array.from(byFeature.values());
}

function AdjustmentsSection({ property }: { property: Property }) {
  const [open, setOpen] = useState(false);
  const adjustments = dedupeAdjustments(
    property.market_reference_adjustments,
    property.market_amenity_adjustments,
  );
  const qualitative = property.market_reference_qualitative_factors ?? [];

  if (adjustments.length === 0 && qualitative.length === 0) return null;

  return (
    <div className="border-t border-line pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted hover:text-ink"
      >
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-0" : "-rotate-90"}`} />
        Ajustamentos considerados ({adjustments.length + qualitative.length})
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-2">
          {adjustments.map((adj) => (
            <AdjustmentRow key={adj.feature} adjustment={adj} />
          ))}
          {qualitative.map((factor) => (
            <QualitativeRow key={factor.factor} factor={factor} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdjustmentRow({ adjustment }: { adjustment: MarketAdjustment }) {
  const range =
    adjustment.impact_low_pct != null && adjustment.impact_high_pct != null
      ? `+${adjustment.impact_low_pct}%–+${adjustment.impact_high_pct}%`
      : null;
  return (
    <div className="rounded-tile bg-surface-sunken px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-ink">{adjustment.feature}</span>
        {range && <span className="font-mono text-positive">{range}</span>}
        {adjustment.importance && (
          <span className="text-ink-faint">{importanceLabel(adjustment.importance)}</span>
        )}
      </div>
      {adjustment.evidence && adjustment.evidence.length > 0 && (
        <p className="mt-1 text-ink-faint">
          Evidência: {adjustment.evidence.map((e) => e.reference ?? e.source).filter(Boolean).join(", ")}
        </p>
      )}
    </div>
  );
}

function QualitativeRow({ factor }: { factor: QualitativeFactor }) {
  return (
    <div className="rounded-tile bg-surface-sunken/60 px-3 py-2 text-xs text-ink-faint">
      <span className="font-medium text-ink-muted">{factor.factor}</span> — não confirmado
      {factor.impact_low_pct != null && factor.impact_high_pct != null
        ? ` (impacto potencial +${factor.impact_low_pct}%–+${factor.impact_high_pct}%)`
        : ""}
    </div>
  );
}
