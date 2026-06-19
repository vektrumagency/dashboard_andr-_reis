"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LeadPageNav({
  prevId,
  nextId,
}: {
  prevId: string | null;
  nextId: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && prevId) router.replace(`/leads/${prevId}`);
      if (event.key === "ArrowRight" && nextId) router.replace(`/leads/${nextId}`);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prevId, nextId, router]);

  return (
    <div className="flex items-center gap-2">
      <NavLink id={prevId} label="← Anterior" />
      <NavLink id={nextId} label="Próximo →" />
    </div>
  );
}

function NavLink({ id, label }: { id: string | null; label: string }) {
  if (!id) {
    return (
      <span className="cursor-not-allowed rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-300">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={`/leads/${id}`}
      replace
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
    >
      {label}
    </Link>
  );
}
