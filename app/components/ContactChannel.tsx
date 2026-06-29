"use client";

import { useState } from "react";
import { Lead } from "@/lib/types";

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
  const [copied, setCopied] = useState(false);

  const rawMessage = lead.ai_note.suggested_message;
  if (!rawMessage) return null;
  const message: string = rawMessage;

  const email = lead.seller.email;
  const phone = lead.seller.phone;

  function handleCopy() {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function handleAction() {
    if (channel === "print") {
      openPrintWindow(lead, message);
      return;
    }
    if (channel === "email" && email != null) {
      window.open(`mailto:${email}?body=${encodeURIComponent(message)}`, "_self");
      return;
    }
    if (channel === "message" && phone != null) {
      const cleaned = phone.replace(/\s/g, "");
      window.open(`https://wa.me/${encodeURIComponent(cleaned)}&text=${encodeURIComponent(message)}`, "_blank");
      return;
    }
    handleCopy();
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

      {/* Message preview */}
      <p className="mb-3 font-mono text-sm leading-relaxed text-zinc-700">{message}</p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleAction}
          className="flex-1 rounded-md bg-zinc-900 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-zinc-700"
        >
          {actionLabel()}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          {copied ? "Copiado ✓" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
