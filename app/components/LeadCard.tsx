import { Lead } from "@/lib/types";
import { formatArea, formatPrice } from "@/lib/format";
import { PRIORITY_LABELS } from "@/lib/leads";
import { zoneTier } from "@/lib/zones";
import { priorityAccent } from "@/lib/priorityAccent";
import { scoreColor } from "@/lib/scoreColor";
import { isNegativeSignal } from "@/lib/signals";
import { CopyButton } from "./CopyButton";
import { LeadStageBar } from "./LeadStageBar";
import { PhotoCarousel } from "./PhotoCarousel";

const SELLER_LABELS: Record<Lead["seller"]["type"], string> = {
  private: "Particular",
  agency: "Agência",
  promoter: "Promotor",
  unknown: "Desconhecido",
};

export function LeadCard({ lead }: { lead: Lead }) {
  const accent = priorityAccent(lead.priority);
  const { property, seller, ai_note } = lead;
  const negativeSignals = lead.signals.filter(isNegativeSignal);
  const positiveSignals = lead.signals.filter((signal) => !isNegativeSignal(signal));

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 ring-1 ${accent.ring} ${accent.glow}`}
    >
      <PhotoCarousel images={property.images} alt={property.title ?? `${property.zone} · ${property.typology}`} />

      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 ${accent.ring.replace("ring-", "border-")} bg-zinc-50 font-mono`}
          >
            <span className={`text-xl font-bold leading-none ${scoreColor(lead.score)}`}>{lead.score}</span>
            <span className="text-[9px] uppercase tracking-widest text-zinc-500">score</span>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              Lead · {lead.id} · Tier {zoneTier(property.zone)}
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
          <div className="px-6 py-5">
            <LeadStageBar status={lead.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 px-6 pb-5">
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
              <div className={`rounded-lg border-l-4 ${accent.ring.replace("ring-", "border-")} bg-white px-4 py-3 shadow-sm`}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Próxima ação
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900">{ai_note.next_action}</p>
              </div>
            )}

            {ai_note.suggested_message && (
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Mensagem sugerida
                  </p>
                  <CopyButton text={ai_note.suggested_message} />
                </div>
                <p className="font-mono text-sm leading-relaxed text-zinc-700">
                  {ai_note.suggested_message}
                </p>
              </div>
            )}

            {lead.manual_notes && (
              <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-3">
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
                className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium ${accent.ring.replace("ring-", "border-")} ${accent.text} hover:bg-zinc-50`}
              >
                Ver anúncio original ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
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
