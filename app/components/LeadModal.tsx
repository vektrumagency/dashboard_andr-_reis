"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdjacentResult, LeadQuery, leadHref } from "@/lib/leadQuery";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable
  );
}

export function LeadModal({
  children,
  adjacency,
  query,
}: {
  children: React.ReactNode;
  adjacency: AdjacentResult;
  query: LeadQuery;
}) {
  const router = useRouter();
  const { prevId, nextId } = adjacency;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      if (event.key === "Escape") router.back();
      if (event.key === "ArrowLeft" && prevId) router.replace(leadHref(prevId, query));
      if (event.key === "ArrowRight" && nextId) router.replace(leadHref(nextId, query));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, prevId, nextId, query]);

  return (
    <>
      <div
        className="modal-backdrop-enter fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-10 backdrop-blur-sm"
        onClick={() => router.back()}
      >
        <div
          className="modal-content-enter relative w-full max-w-4xl"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Fechar"
            className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-ink-muted shadow-sm hover:bg-surface-hover hover:text-ink"
          >
            ✕
          </button>
          {children}
        </div>
      </div>
      <NavArrow direction="prev" id={prevId} query={query} />
      <NavArrow direction="next" id={nextId} query={query} />
    </>
  );
}

function NavArrow({
  direction,
  id,
  query,
}: {
  direction: "prev" | "next";
  id: string | null;
  query: LeadQuery;
}) {
  const router = useRouter();

  if (!id) return null;

  return (
    <button
      type="button"
      onClick={() => router.replace(leadHref(id, query))}
      aria-label={direction === "prev" ? "Lead anterior" : "Lead seguinte"}
      className={`fixed top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-lg text-ink-muted shadow-md hover:bg-surface-hover hover:text-ink ${
        direction === "prev" ? "left-3 sm:left-6" : "right-3 sm:right-6"
      }`}
    >
      {direction === "prev" ? "‹" : "›"}
    </button>
  );
}
