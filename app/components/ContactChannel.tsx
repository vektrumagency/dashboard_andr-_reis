"use client";

import { useState } from "react";
import { Lead } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

type Channel = "email" | "message" | "print";

const CHANNELS: { id: Channel; label: string; icon: string }[] = [
  { id: "email", label: "Email", icon: "✉" },
  { id: "message", label: "Mensagem", icon: "◎" },
  { id: "print", label: "Imprimir", icon: "⎙" },
];

function openPrintWindow(lead: Lead, message: string) {
  const { property, seller } = lead;
  const date = new Date().toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const zone = [property.zone, property.micro_zone].filter(Boolean).join(", ");

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <title>Carta — ${zone}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, serif; font-size: 14px; line-height: 1.7; color: #111; padding: 60px 72px; max-width: 680px; margin: 0 auto; }
    .date { text-align: right; margin-bottom: 40px; color: #555; font-size: 13px; }
    .greeting { margin-bottom: 24px; }
    .body { margin-bottom: 32px; white-space: pre-line; }
    .sign-off { margin-bottom: 4px; }
    .signature { margin-top: 40px; }
    .signature strong { display: block; font-size: 15px; }
    .signature span { font-size: 12px; color: #555; font-style: italic; }
    @media print { body { padding: 20px 40px; } }
  </style>
</head>
<body>
  <div class="date">${date}</div>
  <p class="greeting">Exmo(a). Sr(a)${seller.name ? ` ${seller.name}` : ""},</p>
  <div class="body">${message.replace(/\n/g, "<br/>")}</div>
  <p class="sign-off">Com os melhores cumprimentos,</p>
  <div class="signature">
    <strong>André Reis</strong>
    <span>Consultor Imobiliário · IAD Portugal</span>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=700,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

export function ContactChannel({ lead }: { lead: Lead }) {
  const [channel, setChannel] = useState<Channel>("message");
  const [copied, setCopied] = useState<"message" | "both" | null>(null);

  const message = lead.outreach_message;
  const subject = lead.outreach_message_subject;
  const angle = lead.outreach_angle;
  const personalizationNotes = lead.outreach_personalization_notes;
  const generatedAt = lead.outreach_message_generated_at;
  const status = lead.outreach_message_status;

  const email = lead.seller.email;
  const phone = lead.seller.phone;

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

  function handleAction() {
    if (!message) return;
    if (channel === "print") {
      openPrintWindow(lead, message);
      return;
    }
    if (channel === "email" && email != null) {
      const subjectParam = subject ? `subject=${encodeURIComponent(subject)}&` : "";
      window.open(`mailto:${email}?${subjectParam}body=${encodeURIComponent(message)}`, "_self");
      return;
    }
    if (channel === "message" && phone != null) {
      const cleaned = phone.replace(/\s/g, "");
      window.open(`https://wa.me/${encodeURIComponent(cleaned)}&text=${encodeURIComponent(message)}`, "_blank");
      return;
    }
    copy(message, "message");
  }

  const actionLabel = () => {
    if (channel === "print") return "Imprimir carta";
    if (channel === "email") return email != null ? "Abrir email" : "Copiar";
    if (channel === "message") return phone != null ? "Abrir WhatsApp" : "Copiar";
    return "Copiar";
  };

  return (
    <div className="rounded-lg bg-zinc-100 p-4">
      {/* Channel tabs */}
      <div className="mb-3 flex gap-1 rounded-md bg-zinc-200 p-1">
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => setChannel(ch.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              channel === ch.id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <span>{ch.icon}</span>
            {ch.label}
          </button>
        ))}
      </div>

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
          onClick={handleAction}
          className="flex-1 rounded-md bg-zinc-900 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-zinc-700"
        >
          {actionLabel()}
        </button>
        <button
          type="button"
          onClick={() => copy(message, "message")}
          className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
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
