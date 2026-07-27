"use client";

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export function LeadSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/") return;
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isTyping) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative">
      <Search
        size={16}
        strokeWidth={2}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder='Pesquisar zona, vendedor, sinais, notas... ou um número para score mínimo (ex: 8)'
        className="w-full rounded-tile border border-line-strong bg-surface py-2.5 pl-10 pr-16 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar pesquisa"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
        >
          <X size={14} strokeWidth={2} />
        </button>
      ) : (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-line bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink-faint">
          /
        </kbd>
      )}
    </div>
  );
}
