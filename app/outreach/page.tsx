import { OutreachQueue } from "@/app/components/OutreachQueue";
import { mockLeads } from "@/lib/mockData";

export default function OutreachPage() {
  const queue = mockLeads
    .filter((lead) => lead.priority === "high" && (lead.status === "new" || lead.status === "saved"))
    .sort((a, b) => b.score - a.score);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Outreach</h1>
        <p className="text-sm text-zinc-500">
          {queue.length} leads de prioridade alta à espera de contacto · revê, ajusta e aprova antes
          de enviar
        </p>
      </div>
      <OutreachQueue leads={queue} />
    </main>
  );
}
