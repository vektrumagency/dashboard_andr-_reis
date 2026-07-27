import Link from "next/link";
import { notFound } from "next/navigation";
import { getLead, getLeadsList } from "@/lib/api";
import { adjacentInQuery, leadsIndexHref, parseLeadQuery, searchParamsFromRecord } from "@/lib/leadQuery";
import { LiveLeadCard } from "@/app/components/LiveLeadCard";
import { LeadPageNav } from "@/app/components/LeadPageNav";

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = parseLeadQuery(searchParamsFromRecord(await searchParams));
  const [lead, leads] = await Promise.all([getLead(id), getLeadsList()]);

  if (!lead) {
    notFound();
  }

  const adjacency = adjacentInQuery(leads, query, id);

  return (
    <main className="min-h-full bg-canvas px-4 py-10">
      <div className="modal-content-enter mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Link href={leadsIndexHref(query)} className="text-sm text-ink-muted hover:text-ink">
            ← Voltar à tabela de leads
          </Link>
          <LeadPageNav adjacency={adjacency} query={query} />
        </div>
        <LiveLeadCard lead={lead} adjacency={adjacency} query={query} />
      </div>
    </main>
  );
}
