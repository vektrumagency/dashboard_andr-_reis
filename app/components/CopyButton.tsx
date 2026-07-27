"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-1.5 rounded-tile border border-line-strong px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-ink-muted hover:border-line-strong hover:bg-surface-hover"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copiado" : "Copiar mensagem"}
    </button>
  );
}
