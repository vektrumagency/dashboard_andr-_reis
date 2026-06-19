"use client";

import { useState } from "react";

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
      className="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700"
    >
      {copied ? "Copiado ✓" : "Copiar mensagem"}
    </button>
  );
}
