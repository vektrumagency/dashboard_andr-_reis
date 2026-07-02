import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeads } from "@/lib/api";
import { adjacentLeadIds } from "@/lib/leads";
import { LiveLeadCard } from "@/app/components/LiveLeadCard";
import { LeadPageNav } from "@/app/components/LeadPageNav";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const leads = await getLeads();
  const lead = leads.find((item) => item.id === id);

  if (!lead) {
    notFound();
  }

  const { prevId, nextId } = adjacentLeadIds(leads, id);

  return (
    <main className="min-h-full bg-zinc-50 px-4 py-10">
      <div className="modal-content-enter mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← Voltar à tabela de leads
          </Link>
          <LeadPageNav prevId={prevId} nextId={nextId} />
        </div>
        <LiveLeadCard lead={lead} nextId={nextId} />
      </div>
    </main>
  );
}
