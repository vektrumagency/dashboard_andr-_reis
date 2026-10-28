"use client";

import Link from "next/link";
import { Lead } from "@/lib/types";
import { formatArea, formatPrice, formatPricePerSqm, formatSignedPercent } from "@/lib/format";
import { sellerDisplayName, formatMarketPosition } from "@/lib/leads";
import { LeadQuery, leadHref } from "@/lib/leadQuery";
import { marketPositionTone, scoreTone } from "@/lib/tone";
import { leadHeadlineFacts } from "@/lib/derive/headlineFacts";
import { likelyContainsRenders } from "@/lib/derive/gallery";
import { luxuryTierLabel } from "@/lib/derive/enums";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";
import { LeadThumb } from "./LeadThumb";

export const GRID_COLS = "grid-cols-[132px_1.3fr_0.85fr_0.9fr_1fr_88px_52px_1fr]";

export function LeadRow({ lead, query }: { lead: Lead; query: LeadQuery }) {
  const { property, seller } = lead;
  const facts = leadHeadlineFacts(lead);
  const factByKey = new Map(facts.map((f) => [f.key, f]));
  const furniture = factByKey.get("furniture");
  const occupancy = factByKey.get("occupancy");
  const condition = factByKey.get("condition");
  const multiAgency = factByKey.get("multi_agency");
  const luxuryTier = luxuryTierLabel(lead.property_intelligence?.luxury_tier);
  const marketTone = marketPositionTone(property.price_market_position);
  const score = scoreTone(lead.score);

  return (
    <Link
      href={leadHref(lead.id, query)}
      className={`grid ${GRID_COLS} items-center gap-3 rounded-card border border-line bg-surface px-3 py-2.5 text-sm text-ink shadow-card transition-colors hover:border-line-strong hover:bg-surface-hover`}
    >
      <LeadThumb
        images={property.images}
        photoCount={property.image_count}
        likelyRenders={likelyContainsRenders(lead)}
        alt={property.title ?? `${property.zone} · ${property.typology}`}
      />

      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="truncate font-medium text-ink">{property.zone}</span>
          {property.typology && (
            <span className="shrink-0 text-xs text-ink-faint">{property.typology}</span>
          )}
        </div>
        <p className="truncate text-xs text-ink-muted">
          {[property.micro_zone, formatArea(property.area_sqm)].filter(Boolean).join(" · ")}
        </p>
        {luxuryTier && (
          <span className="mt-1 inline-flex items-center rounded-pill bg-gold-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold">
            {luxuryTier}
          </span>
        )}
      </div>

      <div>
        <p className="font-medium text-ink">{formatPrice(property.price_current)}</p>
        <p className="text-xs text-ink-muted">{formatPricePerSqm(property.price_per_sqm)}</p>
      </div>

      <div>
        {property.price_vs_market_pct != null ? (
          <>
            <p className={`font-mono text-sm font-semibold ${marketTone.text}`}>
              {formatSignedPercent(property.price_vs_market_pct)}
            </p>
            <p className="text-xs text-ink-faint">{formatMarketPosition(property.price_market_position)}</p>
          </>
        ) : (
          <span className="text-xs text-ink-faint">—</span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-ink-muted">{sellerDisplayName(seller)}</p>
        {multiAgency && (
          <p className={`text-xs ${multiAgency.tone.text}`}>{multiAgency.value}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-ink-muted">
        {furniture && (
          <span title={furniture.value} className={furniture.tone.text}>
            <furniture.icon size={16} strokeWidth={1.75} />
          </span>
        )}
        {occupancy && (
          <span title={occupancy.value} className={occupancy.tone.text}>
            <occupancy.icon size={16} strokeWidth={1.75} />
          </span>
        )}
        {condition && (
          <span title={condition.value} className={condition.tone.text}>
            <condition.icon size={16} strokeWidth={1.75} />
          </span>
        )}
        {!furniture && !occupancy && !condition && <span className="text-xs text-ink-faint">—</span>}
      </div>

      <div className="flex h-9 w-9 flex-col items-center justify-center rounded-pill border border-line-strong bg-surface-sunken font-mono">
        <span className={`text-sm font-bold leading-none ${score.text}`}>{lead.score}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={lead.priority} />
        <StatusBadge status={lead.status} />
      </div>
    </Link>
  );
}

export function LeadMobileCard({ lead, query }: { lead: Lead; query: LeadQuery }) {
  const { property } = lead;
  const score = scoreTone(lead.score);

  return (
    <Link href={leadHref(lead.id, query)}
      className="block rounded-card border border-line bg-surface p-3 shadow-card transition-colors hover:border-line-strong hover:bg-surface-hover">
      <div className="flex gap-3">
        <div className="w-24 shrink-0 overflow-hidden rounded-tile"><LeadThumb images={property.images} photoCount={property.image_count}
          likelyRenders={likelyContainsRenders(lead)} alt={property.title ?? property.zone ?? "Imóvel"} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{property.zone || "Zona por confirmar"}</p>
              <p className="truncate text-xs text-ink-muted">{[property.micro_zone, property.typology, formatArea(property.area_sqm)].filter(Boolean).join(" · ")}</p>
            </div>
            <span className={`shrink-0 rounded-pill bg-surface-sunken px-2 py-1 font-mono text-sm font-semibold ${score.text}`}>{lead.score}/10</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-ink">{formatPrice(property.price_current)}</p>
          <p className="text-xs text-ink-muted">{sellerDisplayName(lead.seller)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
        <PriorityBadge priority={lead.priority} />
        <StatusBadge status={lead.status} />
      </div>
    </Link>
  );
}
