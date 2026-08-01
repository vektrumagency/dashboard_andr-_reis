"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Check } from "lucide-react";
import { Lead } from "@/lib/types";
import { formatArea, formatDateTime, formatPrice } from "@/lib/format";
import { scoreTone } from "@/lib/tone";
import { briefingModel } from "@/lib/derive/briefing";
import { CopyButton } from "./CopyButton";
import { PropertyImage } from "./PropertyImage";

export function OutreachQueue({ leads }: { leads: Lead[] }) {
  const [messages, setMessages] = useState<Record<string, string>>(
    Object.fromEntries(leads.map((lead) => [lead.id, lead.outreach_message ?? ""])),
  );
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [copiedBothIds, setCopiedBothIds] = useState<Set<string>>(new Set());

  function copyBoth(lead: Lead) {
    const subject = lead.outreach_message_subject;
    const text = subject ? `${subject}\n\n${messages[lead.id]}` : messages[lead.id];
    navigator.clipboard.writeText(text).then(() => {
      setCopiedBothIds((prev) => new Set(prev).add(lead.id));
      setTimeout(() => {
        setCopiedBothIds((prev) => {
          const next = new Set(prev);
          next.delete(lead.id);
          return next;
        });
      }, 1500);
    });
  }

  if (leads.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-card border border-dashed border-line-strong text-sm text-ink-faint">
        Sem leads de prioridade alta à espera de outreach.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {leads.map((lead) => {
        const approved = approvedIds.has(lead.id);
        const score = scoreTone(lead.score);
        const cover = lead.property.images[0];
        // ai_note.next_action está sempre vazio na BD real — mostrar em vez
        // disso o primeiro motivo do briefing comercial, quando existe.
        const context = briefingModel(lead)?.whyGoodLead[0]?.text ?? lead.monitor_reason;
        return (
          <div
            key={lead.id}
            className={`overflow-hidden rounded-card border bg-surface transition-opacity ${
              approved ? "border-positive/30 opacity-60" : "border-line"
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-tile bg-surface-sunken">
                  <PropertyImage src={cover} alt="" sizes="64px" iconSize={14} />
                </div>
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-pill border-2 border-line-strong bg-surface-sunken font-mono">
                  <span className={`text-sm font-bold leading-none ${score.text}`}>{lead.score}</span>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-ink">
                    {lead.property.zone} {lead.property.typology ? `· ${lead.property.typology}` : ""}
                  </h2>
                  <p className="text-sm text-ink-muted">
                    {formatPrice(lead.property.price_current)} · {formatArea(lead.property.area_sqm)}
                  </p>
                </div>
              </div>
              <Link
                href={`/leads/${lead.id}`}
                className="shrink-0 text-sm text-ink-faint hover:text-ink"
              >
                Ver ficha →
              </Link>
            </div>

            <div className="flex flex-col gap-3 px-6 py-5">
              {context && (
                <p className="text-sm text-ink-muted">
                  <span className="font-medium text-ink">Porquê agora: </span>
                  {context}
                </p>
              )}

              {lead.outreach_message_status === "failed" ? (
                <p className="text-sm text-ink-faint">
                  Mensagem personalizada não gerada para esta lead.
                </p>
              ) : !lead.outreach_message ? (
                <p className="text-sm text-ink-faint">
                  Ainda não há mensagem personalizada para esta lead.
                </p>
              ) : (
                <>
                  {lead.outreach_angle && (
                    <p className="text-xs text-ink-faint">
                      <span className="font-semibold uppercase tracking-wide">Ângulo: </span>
                      {lead.outreach_angle}
                    </p>
                  )}

                  {lead.outreach_message_subject && (
                    <p className="text-sm text-ink-muted">
                      <span className="font-medium text-ink">Assunto sugerido: </span>
                      {lead.outreach_message_subject}
                    </p>
                  )}

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                      Mensagem sugerida (editável)
                    </span>
                    <textarea
                      value={messages[lead.id]}
                      onChange={(event) =>
                        setMessages((prev) => ({ ...prev, [lead.id]: event.target.value }))
                      }
                      disabled={approved}
                      rows={3}
                      className="w-full whitespace-pre-line rounded-tile border border-line-strong bg-surface-sunken p-3 font-mono text-sm leading-relaxed text-ink-muted focus:border-accent focus:outline-none disabled:opacity-70"
                    />
                  </label>

                  {lead.outreach_personalization_notes && lead.outreach_personalization_notes.length > 0 && (
                    <p className="text-xs text-ink-faint">
                      <span className="font-semibold uppercase tracking-wide">Notas de personalização: </span>
                      {lead.outreach_personalization_notes.join(" · ")}
                    </p>
                  )}

                  {lead.outreach_message_generated_at && (
                    <p className="text-[11px] text-ink-faint">
                      Gerada em {formatDateTime(lead.outreach_message_generated_at)}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <CopyButton text={messages[lead.id]} />
                    {lead.outreach_message_subject && (
                      <button
                        type="button"
                        onClick={() => copyBoth(lead)}
                        className="rounded-tile border border-line-strong px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-ink-muted hover:bg-surface-hover"
                      >
                        {copiedBothIds.has(lead.id) ? "Copiado ✓" : "Copiar assunto + mensagem"}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={approved}
                      onClick={() => setApprovedIds((prev) => new Set(prev).add(lead.id))}
                      title="Marca a mensagem como pronta — não envia nada automaticamente"
                      className="flex items-center gap-1.5 rounded-tile bg-positive px-4 py-1.5 text-sm font-medium text-canvas hover:opacity-90 disabled:cursor-default disabled:opacity-50"
                    >
                      {approved ? <Check size={14} /> : <Bookmark size={14} />}
                      {approved ? "Marcada como aprovada" : "Marcar como aprovada"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
