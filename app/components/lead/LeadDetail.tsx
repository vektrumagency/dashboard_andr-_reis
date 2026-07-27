"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Home, MessageSquare, TrendingUp } from "lucide-react";
import { Lead } from "@/lib/types";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import { PRIORITY_LABELS, sellerDisplayName } from "@/lib/leads";
import { priorityTone, scoreTone } from "@/lib/tone";
import { LOCALIZATION_CONFIDENCE_LABELS, localizationMapsUrl } from "@/lib/localization";
import { AdjacentResult, LeadQuery, leadHref, leadsIndexHref } from "@/lib/leadQuery";
import { useLeads } from "@/lib/leadsStore";
import { LeadActionBar } from "../LeadActionBar";
import { ContactChannel } from "../ContactChannel";
import { LeadGallery } from "./LeadGallery";
import { HeadlineFactsStrip } from "./HeadlineFactsStrip";
import { BriefingPanel } from "./BriefingPanel";
import { PriceBandPanel } from "./PriceBandPanel";
import { PropertyPanel } from "./PropertyPanel";

const EXIT_ANIMATION_MS = 250;

type TabKey = "comercial" | "preco" | "imovel" | "mensagem";

const TABS: { key: TabKey; label: string; icon: typeof Briefcase }[] = [
  { key: "comercial", label: "Comercial", icon: Briefcase },
  { key: "preco", label: "Preço", icon: TrendingUp },
  { key: "imovel", label: "Imóvel", icon: Home },
  { key: "mensagem", label: "Mensagem", icon: MessageSquare },
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

export function LeadDetail({
  lead,
  adjacency,
  query,
}: {
  lead: Lead;
  adjacency: AdjacentResult;
  query: LeadQuery;
}) {
  const router = useRouter();
  const {
    updateStatus,
    requestLocalization,
    cancelLocalization,
    isLocalizationPending,
    localizationError,
  } = useLeads();
  const [isExiting, setIsExiting] = useState(false);
  const [tab, setTab] = useState<TabKey>("comercial");
  const accent = priorityTone(lead.priority);
  const score = scoreTone(lead.score);
  const { property, seller } = lead;
  const { nextId, index, total } = adjacency;

  function handleDecide(stage: Lead["status"]) {
    setIsExiting(true);
    updateStatus(lead.id, stage);
    setTimeout(() => {
      router.replace(nextId ? leadHref(nextId, query) : leadsIndexHref(query));
    }, EXIT_ANIMATION_MS);
  }

  async function handleLocate() {
    if (await requestLocalization(lead.id)) {
      setIsExiting(true);
      setTimeout(() => router.replace("/localizar"), EXIT_ANIMATION_MS);
    }
  }

  async function handleCancelLocalization() {
    await cancelLocalization(lead.id);
  }

  const localizationPending = isLocalizationPending(lead.id);
  const localizationFailure = localizationError(lead.id);
  const disabled = isExiting || localizationPending;

  /**
   * Atalhos de teclado do deck de triagem: 1/2/3 decidem, L pede
   * localização, sem interferir com as setas (que já mudam de lead em
   * LeadModal/LeadPageNav) nem com quem está a escrever num campo — ver
   * isTypingTarget. Ignoramos também combinações com modificador (⌘/Ctrl)
   * para não colidir com atalhos do browser.
   */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (disabled) return;
      if (isTypingTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      switch (event.key) {
        case "1":
          handleDecide("not_relevant");
          break;
        case "2":
          handleDecide("contacted");
          break;
        case "3":
          handleDecide("visit");
          break;
        case "l":
        case "L":
          if (lead.status !== "locating") handleLocate();
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, lead.status, lead.id]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-card border border-line bg-surface text-ink shadow-card ${
        isExiting ? "lead-card-exit" : ""
      }`}
    >
      <LeadGallery lead={lead} />

      {index > 0 && (
        <div className="flex items-center gap-2 border-b border-line bg-surface-sunken px-6 py-2 text-[11px] text-ink-faint">
          <span className="font-mono">
            {index} de {total}
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-pill bg-line">
            <div
              className="h-full rounded-pill bg-accent transition-all"
              style={{ width: `${(index / total) * 100}%` }}
            />
          </div>
          <span className="hidden sm:inline">1/2/3 decide · L localiza</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-pill border-2 border-line-strong bg-surface-sunken font-mono">
            <span className={`text-xl font-bold leading-none ${score.text}`}>{lead.score}</span>
            <span className="text-[9px] uppercase tracking-widest text-ink-faint">/10</span>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">
              Lead · {lead.id}
              {property.municipality ? ` · ${property.municipality}` : ""}
            </p>
            <h2 className="text-xl font-semibold text-ink">
              {property.zone} {property.typology ? `· ${property.typology}` : ""}
            </h2>
            {property.micro_zone && <p className="text-sm text-ink-muted">{property.micro_zone}</p>}
            <p className="mt-1 text-[11px] text-ink-faint">
              Criado {formatRelativeTime(lead.created_at)} · Atualizado {formatRelativeTime(lead.updated_at)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-lg font-semibold text-ink">{formatPrice(property.price_current)}</span>
          <span
            className={`shrink-0 rounded-pill border px-3 py-1 text-xs font-bold uppercase tracking-widest ${accent.border} ${accent.text}`}
          >
            {PRIORITY_LABELS[lead.priority]}
          </span>
        </div>
      </div>

      <HeadlineFactsStrip lead={lead} />

      <div className="flex gap-1 overflow-x-auto border-b border-line px-4">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                active
                  ? "border-accent text-ink"
                  : "border-transparent text-ink-faint hover:text-ink-muted"
              }`}
            >
              <t.icon size={15} strokeWidth={2} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "comercial" && <BriefingPanel lead={lead} />}
      {tab === "preco" && <PriceBandPanel property={property} priceHistory={lead.price_history} />}
      {tab === "imovel" && <PropertyPanel lead={lead} />}
      {tab === "mensagem" && (
        <div className="px-6 py-5">
          <ContactChannel lead={lead} />
        </div>
      )}

      {lead.localization_case && (
        <div className="border-t border-line px-6 py-4">
          <LocalizationPanel localization={lead.localization_case} />
        </div>
      )}

      {lead.manual_notes && (
        <div className="border-t border-line px-6 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Notas (André)</p>
          <p className="mt-1 text-sm text-ink-muted">{lead.manual_notes}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-line px-6 py-4 text-xs text-ink-faint">
        <span>{sellerDisplayName(seller)}</span>
        {property.listing_url && (
          <a
            href={property.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-muted hover:text-ink"
          >
            Ver anúncio original ↗
          </a>
        )}
        {property.lat != null && property.lng != null && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-muted hover:text-ink"
          >
            Ver no Google Maps ↗
          </a>
        )}
        {property.portal_listing_id && (
          <span className="ml-auto">ID anúncio: {property.portal_listing_id}</span>
        )}
      </div>

      {localizationFailure && (
        <div role="alert" className="border-t border-negative/30 bg-negative-soft px-6 py-3 text-sm text-negative">
          {localizationFailure}
        </div>
      )}

      <div className="sticky bottom-0 border-t border-line bg-surface/95 backdrop-blur-sm">
        <LeadActionBar
          status={lead.status}
          localizationStatus={lead.localization_case?.status}
          disabled={isExiting || localizationPending}
          onDecide={handleDecide}
          onLocate={handleLocate}
          onCancelLocalization={handleCancelLocalization}
        />
      </div>
    </div>
  );
}

function LocalizationPanel({ localization }: { localization: NonNullable<Lead["localization_case"]> }) {
  const answer = localization.answer;
  if (localization.status === "processing" || !answer) {
    return (
      <div className="rounded-tile border border-warning/30 bg-warning-soft px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">
          Localização em processamento
        </p>
        <p className="mt-1 text-sm text-ink">A Vektrum está a tentar localizar este imóvel.</p>
        <p className="mt-1 text-xs text-warning/80">
          Pedido enviado {formatRelativeTime(localization.requested_at)}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-tile border border-accent/30 bg-accent-soft px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
        Morada estimada pela Vektrum
      </p>
      <p className="mt-1 text-base font-semibold text-ink">{answer.formatted_address}</p>
      <p className="mt-1 text-xs font-medium text-accent">
        {LOCALIZATION_CONFIDENCE_LABELS[answer.confidence]}
        {localization.answered_at ? ` · respondido ${formatRelativeTime(localization.answered_at)}` : ""}
      </p>
      {answer.explanation && (
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{answer.explanation}</p>
      )}
      <a
        href={localizationMapsUrl(answer)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs font-semibold text-accent underline underline-offset-2"
      >
        Abrir no Google Maps ↗
      </a>
    </div>
  );
}
