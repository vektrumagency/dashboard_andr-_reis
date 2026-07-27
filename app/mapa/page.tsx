import { LeadsMap } from "@/app/components/LeadsMap";
import { getLeadsList } from "@/lib/api";
import { marketsSummary } from "@/lib/leads";

export default async function MapaPage() {
  const leads = await getLeadsList();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Mapa</h1>
        <p className="text-sm text-zinc-500">
          {leads.length} leads em {marketsSummary(leads)} · pins coloridos por prioridade
        </p>
      </div>
      <LeadsMap leads={leads} />
    </main>
  );
}
