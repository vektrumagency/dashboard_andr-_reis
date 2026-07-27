"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import {
  groupLocalizationLeads,
  LOCALIZATION_CONFIDENCE_LABELS,
  localizationMapsUrl,
} from "@/lib/localization";
import { Lead } from "@/lib/types";
import { useLeads } from "@/lib/leadsStore";

export default function LocalizarPage() {
  const { leads } = useLeads();
  const groups = useMemo(() => groupLocalizationLeads(leads), [leads]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Vektrum</p>
        <h1 className="text-2xl font-semibold text-ink">Localizar</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {groups.processing.length} em processamento · {groups.answered.length} respondidos
        </p>
      </div>

      <LocalizationSection
        title="Em processamento"
        description="Imóveis enviados à Vektrum e ainda em análise."
        leads={groups.processing}
        empty="Não há imóveis à espera de localização."
      />
      <LocalizationSection
        title="Respondidos"
        description="A melhor estimativa de morada disponível para cada imóvel."
        leads={groups.answered}
        empty="Ainda não existem localizações respondidas."
        answered
      />
    </main>
  );
}

function LocalizationSection({
  title,
  description,
  leads,
  empty,
  answered = false,
}: {
  title: string;
  description: string;
  leads: Lead[];
  empty: string;
  answered?: boolean;
}) {
  const router = useRouter();

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="text-sm text-ink-muted">{description}</p>
        </div>
        <span className="rounded-pill bg-surface-sunken px-2.5 py-1 font-mono text-xs text-ink-muted">
          {leads.length}
        </span>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong bg-surface px-5 py-10 text-center text-sm text-ink-faint">
          {empty}
        </div>
      ) : (
        <div className="grid gap-3">
          {leads.map((lead) => {
            const localization = lead.localization_case;
            const answer = localization?.answer;
            return (
              <article
                key={lead.id}
                onClick={() => router.push(`/leads/${lead.id}`)}
                className="cursor-pointer rounded-card border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-ink">
                      {lead.property.title ||
                        [lead.property.zone, lead.property.typology].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {[lead.property.zone, lead.property.micro_zone, formatPrice(lead.property.price_current)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {localization && (
                      <p className="mt-2 text-xs text-ink-faint">
                        {answered ? "Respondido" : "Pedido enviado"}{" "}
                        {formatRelativeTime(
                          answered && localization.answered_at
                            ? localization.answered_at
                            : localization.requested_at,
                        )}
                      </p>
                    )}
                  </div>

                  {answered && answer ? (
                    <div className="max-w-md rounded-tile bg-accent-soft px-4 py-3 sm:text-right">
                      <p className="text-sm font-semibold text-ink">{answer.formatted_address}</p>
                      <p className="mt-1 text-xs text-accent">
                        {LOCALIZATION_CONFIDENCE_LABELS[answer.confidence]}
                      </p>
                      <a
                        href={localizationMapsUrl(answer)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="mt-2 inline-block text-xs font-medium text-accent underline underline-offset-2"
                      >
                        Abrir no Google Maps ↗
                      </a>
                    </div>
                  ) : (
                    <span className="self-start rounded-pill bg-warning-soft px-3 py-1 text-xs font-medium text-warning">
                      Em processamento
                    </span>
                  )}
                </div>

                {lead.property.listing_url && (
                  <a
                    href={lead.property.listing_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="mt-4 inline-block text-xs font-medium text-ink-faint hover:text-ink"
                  >
                    Ver anúncio original ↗
                  </a>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
