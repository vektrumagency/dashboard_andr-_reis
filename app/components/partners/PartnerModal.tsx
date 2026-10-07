"use client";

import { useRouter } from "next/navigation";

export function PartnerModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-10 backdrop-blur-sm" onClick={() => router.back()}>
    <div className="modal-content-enter relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
      <button type="button" aria-label="Fechar" onClick={() => router.back()}
        className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-ink-muted hover:text-ink">✕</button>
      {children}
    </div>
  </div>;
}
