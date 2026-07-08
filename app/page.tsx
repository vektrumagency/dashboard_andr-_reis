"use client";

import { LeadsTable } from "@/app/components/LeadsTable";
import { useLeads } from "@/lib/leadsStore";
import { marketsSummary } from "@/lib/leads";

export default function LeadsPage() {
  const { leads } = useLeads();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Leads</h1>
        <p className="text-sm text-zinc-500">
          {leads.length} leads em {marketsSummary(leads)} · ordenados por score
        </p>
      </div>
      <LeadsTable leads={leads} />
    </main>
  );
}
