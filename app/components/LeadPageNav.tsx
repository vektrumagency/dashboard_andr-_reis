"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdjacentResult, LeadQuery, leadHref } from "@/lib/leadQuery";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable
  );
}

export function LeadPageNav({ adjacency, query }: { adjacency: AdjacentResult; query: LeadQuery }) {
  const router = useRouter();
  const { prevId, nextId, index, total } = adjacency;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      if (event.key === "ArrowLeft" && prevId) router.replace(leadHref(prevId, query));
      if (event.key === "ArrowRight" && nextId) router.replace(leadHref(nextId, query));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prevId, nextId, query, router]);

  return (
    <div className="flex items-center gap-3">
      {index > 0 && <span className="font-mono text-xs text-ink-faint">{index} de {total}</span>}
      <div className="flex items-center gap-2">
        <NavLink id={prevId} label="← Anterior" query={query} />
        <NavLink id={nextId} label="Próximo →" query={query} />
      </div>
    </div>
  );
}

function NavLink({ id, label, query }: { id: string | null; label: string; query: LeadQuery }) {
  if (!id) {
    return (
      <span className="cursor-not-allowed rounded-md border border-line px-3 py-1.5 text-sm text-ink-faint">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={leadHref(id, query)}
      replace
      className="rounded-md border border-line-strong px-3 py-1.5 text-sm font-medium text-ink-muted hover:bg-surface-hover hover:text-ink"
    >
      {label}
    </Link>
  );
}
