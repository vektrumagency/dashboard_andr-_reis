"use client";

import { useMemo } from "react";
import { OutreachQueue } from "@/app/components/OutreachQueue";
import { useLeads } from "@/lib/leadsStore";

export default function AtacarPage() {
  const { leads } = useLeads();

  // Antes só "priority === high && status === new" — um lead de prioridade
  // alta desaparecia da fila assim que era guardado, mesmo continuando por
  // contactar. "saved" continua a precisar de outreach.
  const queue = useMemo(
    () =>
      leads
        .filter((lead) => lead.priority === "high" && (lead.status === "new" || lead.status === "saved"))
        .sort((a, b) => b.score - a.score),
    [leads],
  );

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Atacar</h1>
        <p className="text-sm text-ink-muted">
          {queue.length} leads de prioridade alta à espera de contacto · revê e ajusta a mensagem — o
          envio é sempre feito por ti
        </p>
      </div>
      <OutreachQueue leads={queue} />
    </main>
  );
}
