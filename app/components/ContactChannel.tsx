"use client";

import { useState } from "react";
import { Lead } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export function ContactChannel({ lead }: { lead: Lead }) {
  const [copied, setCopied] = useState<"message" | "both" | null>(null);

  const message = lead.outreach_message;
  const subject = lead.outreach_message_subject;
  const angle = lead.outreach_angle;
  const personalizationNotes = lead.outreach_personalization_notes;
  const generatedAt = lead.outreach_message_generated_at;
  const status = lead.outreach_message_status;

  function copy(text: string, kind: "message" | "both") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  if (status === "failed") {
    return (
      <div className="rounded-lg bg-zinc-100 p-4">
        <p className="text-sm text-zinc-500">Mensagem personalizada não gerada para esta lead.</p>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="rounded-lg bg-zinc-100 p-4">
        <p className="text-sm text-zinc-500">Ainda não há mensagem personalizada para esta lead.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-zinc-100 p-4">
      {angle && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Ângulo</p>
          <p className="mt-0.5 text-sm text-zinc-700">{angle}</p>
        </div>
      )}

      {subject && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Assunto sugerido
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-900">{subject}</p>
        </div>
      )}

      {/* Message preview */}
      <div className="mb-3">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Mensagem sugerida
        </p>
        <p className="whitespace-pre-line font-mono text-sm leading-relaxed text-zinc-700">{message}</p>
      </div>

      {personalizationNotes && (
        <div className="mb-3 rounded-md bg-white/70 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Notas de personalização
          </p>
          <p className="mt-0.5 text-sm text-zinc-600">{personalizationNotes}</p>
        </div>
      )}

      {generatedAt && (
        <p className="mb-3 text-[11px] text-zinc-400">Gerada em {formatDateTime(generatedAt)}</p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => copy(message, "message")}
          className="flex-1 rounded-md bg-zinc-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-zinc-700"
        >
          {copied === "message" ? "Copiado ✓" : "Copiar mensagem"}
        </button>
        {subject && (
          <button
            type="button"
            onClick={() => copy(`${subject}\n\n${message}`, "both")}
            className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            {copied === "both" ? "Copiado ✓" : "Copiar assunto + mensagem"}
          </button>
        )}
      </div>
    </div>
  );
}
