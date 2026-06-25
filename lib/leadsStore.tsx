"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Lead, LeadStatus } from "./types";

const STORAGE_KEY = "andre-reis-dashboard:lead-status-overrides";

type LeadsContextValue = {
  leads: Lead[];
  updateStatus: (id: string, status: LeadStatus) => void;
};

const LeadsContext = createContext<LeadsContextValue | null>(null);

/**
 * Não há Supabase ainda — os estados editados localmente (André a mudar
 * Novo/Guardado/Contactado/Visita) ficam em localStorage em vez de se
 * perderem. Quando o Luís disponibilizar a base de dados, `updateStatus`
 * passa a chamar a API real e `initialLeads` passa a vir de lá.
 */
export function LeadsProvider({
  initialLeads,
  children,
}: {
  initialLeads: Lead[];
  children: React.ReactNode;
}) {
  const [overrides, setOverrides] = useState<Record<string, LeadStatus>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setOverrides(JSON.parse(stored));
    } catch {
      // localStorage indisponível ou corrompido — segue com os dados originais
    }
  }, []);

  const leads = useMemo(
    () =>
      initialLeads.map((lead) =>
        overrides[lead.id] ? { ...lead, status: overrides[lead.id] } : lead,
      ),
    [initialLeads, overrides],
  );

  function updateStatus(id: string, status: LeadStatus) {
    setOverrides((prev) => {
      const next = { ...prev, [id]: status };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignora falha ao gravar
      }
      return next;
    });
  }

  return <LeadsContext.Provider value={{ leads, updateStatus }}>{children}</LeadsContext.Provider>;
}

export function useLeads(): LeadsContextValue {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads tem de ser usado dentro de LeadsProvider");
  return ctx;
}
