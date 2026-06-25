import Link from "next/link";
import { notFound } from "next/navigation";
import { mockLeads } from "@/lib/mockData";
import { adjacentLeadIds } from "@/lib/leads";
import { LiveLeadCard } from "@/app/components/LiveLeadCard";
import { LeadPageNav } from "@/app/components/LeadPageNav";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = mockLeads.find((item) => item.id === id);

  if (!lead) {
    notFound();
  }

  const { prevId, nextId } = adjacentLeadIds(mockLeads, id);

  return (
    <main className="min-h-full bg-zinc-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← Voltar à tabela de leads
          </Link>
          <LeadPageNav prevId={prevId} nextId={nextId} />
        </div>
        <LiveLeadCard lead={lead} />
      </div>
    </main>
  );
}
