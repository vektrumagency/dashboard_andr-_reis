"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Lead, LeadStatus } from "./types";

type LeadsContextValue = {
  leads: Lead[];
  updateStatus: (id: string, status: LeadStatus) => void;
};

const LeadsContext = createContext<LeadsContextValue | null>(null);

export function LeadsProvider({
  initialLeads,
  children,
}: {
  initialLeads: Lead[];
  children: React.ReactNode;
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);

  const updateStatus = useCallback((id: string, status: LeadStatus) => {
    let previous: Lead[] = [];
    setLeads((current) => {
      previous = current;
      return current.map((lead) => (lead.id === id ? { ...lead, status } : lead));
    });

    fetch(`/api/leads/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`PATCH /api/leads/${id}/status falhou: ${res.status}`);
      })
      .catch((error) => {
        console.error("Falha ao gravar estado do lead, a reverter:", error);
        setLeads(previous);
      });
  }, []);

  const value = useMemo(() => ({ leads, updateStatus }), [leads, updateStatus]);

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function useLeads(): LeadsContextValue {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads tem de ser usado dentro de LeadsProvider");
  return ctx;
}
