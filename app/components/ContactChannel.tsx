"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
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
      <div className="rounded-tile bg-surface-sunken p-4">
        <p className="text-sm text-ink-faint">Mensagem personalizada não gerada para esta lead.</p>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="rounded-tile bg-surface-sunken p-4">
        <p className="text-sm text-ink-faint">Ainda não há mensagem personalizada para esta lead.</p>
      </div>
    );
  }

  return (
    <div className="rounded-tile bg-surface-sunken p-4">
      {angle && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Ângulo</p>
          <p className="mt-0.5 text-sm text-ink-muted">{angle}</p>
        </div>
      )}

      {subject && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Assunto sugerido
          </p>
          <p className="mt-0.5 text-sm font-medium text-ink">{subject}</p>
        </div>
      )}

      <div className="mb-3">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          Mensagem sugerida
        </p>
        <p className="whitespace-pre-line font-mono text-sm leading-relaxed text-ink-muted">{message}</p>
      </div>

      {personalizationNotes && personalizationNotes.length > 0 && (
        <div className="mb-3 rounded-tile bg-surface px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Notas de personalização
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">{personalizationNotes.join(" · ")}</p>
        </div>
      )}

      {generatedAt && (
        <p className="mb-3 text-[11px] text-ink-faint">Gerada em {formatDateTime(generatedAt)}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => copy(message, "message")}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-tile bg-accent px-3 py-2 text-xs font-semibold uppercase tracking-wide text-canvas transition-colors hover:bg-accent-strong"
        >
          {copied === "message" ? <Check size={13} /> : <Copy size={13} />}
          {copied === "message" ? "Copiado" : "Copiar mensagem"}
        </button>
        {subject && (
          <button
            type="button"
            onClick={() => copy(`${subject}\n\n${message}`, "both")}
            className="flex items-center gap-1.5 rounded-tile border border-line-strong px-3 py-2 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-hover"
          >
            {copied === "both" ? <Check size={13} /> : <Copy size={13} />}
            {copied === "both" ? "Copiado" : "Copiar assunto + mensagem"}
          </button>
        )}
      </div>
    </div>
  );
}
