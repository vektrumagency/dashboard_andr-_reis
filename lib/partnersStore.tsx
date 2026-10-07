"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { PartnerListItem, PartnerStage } from "./partners";

interface PartnersContextValue {
  partners: PartnerListItem[];
  pending: Set<string>;
  errors: Record<string, string>;
  updateStage: (id: string, stage: PartnerStage) => Promise<boolean>;
}

const PartnersContext = createContext<PartnersContextValue | null>(null);

export function PartnersProvider({ initialPartners, children }: { initialPartners: PartnerListItem[]; children: React.ReactNode }) {
  const [partners, setPartners] = useState(initialPartners);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const pendingRef = useRef(new Set<string>());
  const partnersRef = useRef(partners);
  useEffect(() => { partnersRef.current = partners; }, [partners]);

  const updateStage = useCallback(async (id: string, stage: PartnerStage): Promise<boolean> => {
    if (pendingRef.current.has(id)) return false;
    const current = partnersRef.current.find((partner) => partner.id === id);
    if (!current || current.funnel_stage === stage) return true;
    pendingRef.current.add(id);
    setPending(new Set(pendingRef.current));
    setErrors((previous) => { const next = { ...previous }; delete next[id]; return next; });
    setPartners((previous) => previous.map((partner) => partner.id === id ? { ...partner, funnel_stage: stage } : partner));
    try {
      const response = await fetch(`/api/parceiros/${id}/stage`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }),
      });
      if (!response.ok) throw new Error("Falha ao guardar o estado.");
      const result = await response.json() as { updated_at?: string };
      setPartners((previous) => previous.map((partner) => partner.id === id ? { ...partner, updated_at: result.updated_at ?? partner.updated_at } : partner));
      return true;
    } catch {
      setPartners((previous) => previous.map((partner) => partner.id === id ? { ...partner, funnel_stage: current.funnel_stage } : partner));
      setErrors((previous) => ({ ...previous, [id]: "Não foi possível guardar. Tenta novamente." }));
      return false;
    } finally {
      pendingRef.current.delete(id);
      setPending(new Set(pendingRef.current));
    }
  }, []);

  const value = useMemo(() => ({ partners, pending, errors, updateStage }), [partners, pending, errors, updateStage]);
  return <PartnersContext.Provider value={value}>{children}</PartnersContext.Provider>;
}

export function usePartners(): PartnersContextValue {
  const value = useContext(PartnersContext);
  if (!value) throw new Error("usePartners requer PartnersProvider");
  return value;
}
