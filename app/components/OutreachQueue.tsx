"use client";

import { useState } from "react";
import Link from "next/link";
import { Lead } from "@/lib/types";
import { formatArea, formatDateTime, formatPrice } from "@/lib/format";
import { scoreColor } from "@/lib/scoreColor";
import { CopyButton } from "./CopyButton";

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
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-400">
        Sem leads de prioridade alta à espera de outreach.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {leads.map((lead) => {
        const approved = approvedIds.has(lead.id);
        return (
          <div
            key={lead.id}
            className={`rounded-2xl border bg-white transition-opacity ${
              approved ? "border-emerald-200 opacity-60" : "border-zinc-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full border-2 border-red-500/30 bg-zinc-50 font-mono">
                  <span className={`text-base font-bold leading-none ${scoreColor(lead.score)}`}>
                    {lead.score}
                  </span>
                </div>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                    {lead.id}
                  </p>
                  <h2 className="text-base font-semibold text-zinc-900">
                    {lead.property.zone} · {lead.property.typology}
                  </h2>
                  <p className="text-sm text-zinc-500">
                    {formatPrice(lead.property.price_current)} · {formatArea(lead.property.area_sqm)} ·{" "}
                    {lead.property.days_on_market} dias no mercado
                  </p>
                </div>
              </div>
              <Link
                href={`/leads/${lead.id}`}
                className="shrink-0 text-sm text-zinc-500 hover:text-zinc-900"
              >
                Ver ficha →
              </Link>
            </div>

            <div className="flex flex-col gap-3 px-6 py-5">
              {lead.ai_note.next_action && (
                <p className="text-sm text-zinc-600">
                  <span className="font-medium text-zinc-900">Próxima ação: </span>
                  {lead.ai_note.next_action}
                </p>
              )}

              {lead.outreach_message_status === "failed" ? (
                <p className="text-sm text-zinc-500">
                  Mensagem personalizada não gerada para esta lead.
                </p>
              ) : !lead.outreach_message ? (
                <p className="text-sm text-zinc-500">
                  Ainda não há mensagem personalizada para esta lead.
                </p>
              ) : (
                <>
                  {lead.outreach_angle && (
                    <p className="text-xs text-zinc-500">
                      <span className="font-semibold uppercase tracking-wide">Ângulo: </span>
                      {lead.outreach_angle}
                    </p>
                  )}

                  {lead.outreach_message_subject && (
                    <p className="text-sm text-zinc-700">
                      <span className="font-medium text-zinc-900">Assunto sugerido: </span>
                      {lead.outreach_message_subject}
                    </p>
                  )}

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      Mensagem sugerida (editável)
                    </span>
                    <textarea
                      value={messages[lead.id]}
                      onChange={(event) =>
                        setMessages((prev) => ({ ...prev, [lead.id]: event.target.value }))
                      }
                      disabled={approved}
                      rows={3}
                      className="w-full whitespace-pre-line rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-sm leading-relaxed text-zinc-700 focus:border-zinc-400 focus:outline-none disabled:opacity-70"
                    />
                  </label>

                  {lead.outreach_personalization_notes && (
                    <p className="text-xs text-zinc-500">
                      <span className="font-semibold uppercase tracking-wide">Notas de personalização: </span>
                      {lead.outreach_personalization_notes}
                    </p>
                  )}

                  {lead.outreach_message_generated_at && (
                    <p className="text-[11px] text-zinc-400">
                      Gerada em {formatDateTime(lead.outreach_message_generated_at)}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <CopyButton text={messages[lead.id]} />
                    {lead.outreach_message_subject && (
                      <button
                        type="button"
                        onClick={() => copyBoth(lead)}
                        className="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700"
                      >
                        {copiedBothIds.has(lead.id) ? "Copiado ✓" : "Copiar assunto + mensagem"}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={approved}
                      onClick={() => setApprovedIds((prev) => new Set(prev).add(lead.id))}
                      className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-default disabled:bg-emerald-600/50"
                    >
                      {approved ? "Aprovado ✓" : "Aprovar envio"}
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
