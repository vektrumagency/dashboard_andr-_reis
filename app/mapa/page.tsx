import { LeadsMap } from "@/app/components/LeadsMap";
import { getLeadsList } from "@/lib/api";
import { marketsSummary } from "@/lib/leads";

export default async function MapaPage() {
  const leads = await getLeadsList();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Visão geográfica</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Mapa</h1>
        <p className="text-sm text-ink-muted">
          {leads.length} leads em {marketsSummary(leads)} · pins coloridos por prioridade
        </p>
      </div>
      <LeadsMap leads={leads} />
    </main>
  );
}
