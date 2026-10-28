"use client";

import { LeadsTable } from "@/app/components/LeadsTable";
import { useLeads } from "@/lib/leadsStore";
import { marketsSummary } from "@/lib/leads";

export default function LeadsPage() {
  const { leads } = useLeads();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Pipeline imobiliário</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Leads</h1>
        <p className="text-sm text-ink-muted">
          {leads.length} leads em {marketsSummary(leads)}
        </p>
      </div>
      <LeadsTable leads={leads} />
    </main>
  );
}
