"use client";

import { Lead } from "@/lib/types";
import { useLeads } from "@/lib/leadsStore";
import { LeadCard } from "./LeadCard";

export function LiveLeadCard({ lead }: { lead: Lead }) {
  const { leads } = useLeads();
  const live = leads.find((item) => item.id === lead.id) ?? lead;
  return <LeadCard lead={live} />;
}
