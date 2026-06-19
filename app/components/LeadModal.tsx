"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LeadModal({
  children,
  prevId,
  nextId,
}: {
  children: React.ReactNode;
  prevId?: string | null;
  nextId?: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") router.back();
      if (event.key === "ArrowLeft" && prevId) router.replace(`/leads/${prevId}`);
      if (event.key === "ArrowRight" && nextId) router.replace(`/leads/${nextId}`);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, prevId, nextId]);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-10 backdrop-blur-sm"
        onClick={() => router.back()}
      >
        <div className="relative w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Fechar"
            className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:bg-zinc-50 hover:text-zinc-700"
          >
            ✕
          </button>
          {children}
        </div>
      </div>
      <NavArrow direction="prev" id={prevId ?? null} />
      <NavArrow direction="next" id={nextId ?? null} />
    </>
  );
}

function NavArrow({ direction, id }: { direction: "prev" | "next"; id: string | null }) {
  const router = useRouter();

  if (!id) return null;

  return (
    <button
      type="button"
      onClick={() => router.replace(`/leads/${id}`)}
      aria-label={direction === "prev" ? "Lead anterior" : "Lead seguinte"}
      className={`fixed top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-lg text-zinc-600 shadow-md hover:bg-zinc-50 hover:text-zinc-900 ${
        direction === "prev" ? "left-3 sm:left-6" : "right-3 sm:right-6"
      }`}
    >
      {direction === "prev" ? "‹" : "›"}
    </button>
  );
}
