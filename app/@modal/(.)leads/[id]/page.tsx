import { notFound } from "next/navigation";
import { getLeads } from "@/lib/api";
import { adjacentLeadIds } from "@/lib/leads";
import { LiveLeadCard } from "@/app/components/LiveLeadCard";
import { LeadModal } from "@/app/components/LeadModal";

export default async function LeadModalPage({
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
    <LeadModal prevId={prevId} nextId={nextId}>
      <LiveLeadCard lead={lead} nextId={nextId} />
    </LeadModal>
  );
}
