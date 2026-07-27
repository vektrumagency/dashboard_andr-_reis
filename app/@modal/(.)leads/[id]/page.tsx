import { notFound } from "next/navigation";
import { getLead, getLeadsList } from "@/lib/api";
import { adjacentInQuery, parseLeadQuery, searchParamsFromRecord } from "@/lib/leadQuery";
import { LiveLeadCard } from "@/app/components/LiveLeadCard";
import { LeadModal } from "@/app/components/LeadModal";

export default async function LeadModalPage({
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
    <LeadModal adjacency={adjacency} query={query}>
      <LiveLeadCard lead={lead} adjacency={adjacency} query={query} />
    </LeadModal>
  );
}
