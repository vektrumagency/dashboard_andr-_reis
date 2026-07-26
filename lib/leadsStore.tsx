"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Lead, LeadStatus } from "./types";

type LeadsContextValue = {
  leads: Lead[];
  updateStatus: (id: string, status: LeadStatus) => void;
  requestLocalization: (id: string) => Promise<boolean>;
  cancelLocalization: (id: string) => Promise<boolean>;
  isLocalizationPending: (id: string) => boolean;
  localizationError: (id: string) => string | null;
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
  const [localizationPendingIds, setLocalizationPendingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [localizationErrors, setLocalizationErrors] = useState<Record<string, string>>({});

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

  const mutateLocalization = useCallback(async (id: string, method: "POST" | "DELETE") => {
    setLocalizationPendingIds((current) => new Set(current).add(id));
    setLocalizationErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    try {
      const response = await fetch(`/api/leads/${id}/localization`, { method });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Não foi possível atualizar o pedido.");
      }
      setLeads((current) =>
        current.map((lead) =>
          lead.id === id
            ? {
                ...lead,
                status: payload.status,
                localization_case: payload.localization_case,
                updated_at: payload.updated_at,
              }
            : lead,
        ),
      );
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "O pedido falhou.";
      setLocalizationErrors((current) => ({ ...current, [id]: message }));
      return false;
    } finally {
      setLocalizationPendingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const requestLocalization = useCallback(
    (id: string) => mutateLocalization(id, "POST"),
    [mutateLocalization],
  );
  const cancelLocalization = useCallback(
    (id: string) => mutateLocalization(id, "DELETE"),
    [mutateLocalization],
  );
  const isLocalizationPending = useCallback(
    (id: string) => localizationPendingIds.has(id),
    [localizationPendingIds],
  );
  const localizationError = useCallback(
    (id: string) => localizationErrors[id] ?? null,
    [localizationErrors],
  );

  const value = useMemo(
    () => ({
      leads,
      updateStatus,
      requestLocalization,
      cancelLocalization,
      isLocalizationPending,
      localizationError,
    }),
    [
      leads,
      updateStatus,
      requestLocalization,
      cancelLocalization,
      isLocalizationPending,
      localizationError,
    ],
  );

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function useLeads(): LeadsContextValue {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads tem de ser usado dentro de LeadsProvider");
  return ctx;
}
