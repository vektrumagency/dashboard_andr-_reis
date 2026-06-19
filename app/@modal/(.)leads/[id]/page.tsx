import { notFound } from "next/navigation";
import { mockLeads } from "@/lib/mockData";
import { adjacentLeadIds } from "@/lib/leads";
import { LeadCard } from "@/app/components/LeadCard";
import { LeadModal } from "@/app/components/LeadModal";

export default async function LeadModalPage({
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
    <LeadModal prevId={prevId} nextId={nextId}>
      <LeadCard lead={lead} />
    </LeadModal>
  );
}
