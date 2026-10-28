"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { RecruitmentListItem } from "./recruitment";
import type { RecruitmentStageChange } from "./recruitmentApi";

interface RecruitmentContextValue {
  candidates: RecruitmentListItem[];
  pending: Set<string>;
  errors: Record<string, string>;
  updateStage: (id: string, change: RecruitmentStageChange) => Promise<string | null>;
}

const RecruitmentContext = createContext<RecruitmentContextValue | null>(null);

export function RecruitmentProvider({ initialCandidates, children }: { initialCandidates: RecruitmentListItem[]; children: React.ReactNode }) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateStage = useCallback(async (id: string, change: RecruitmentStageChange): Promise<string | null> => {
    setPending((previous) => new Set(previous).add(id));
    setErrors((previous) => { const next = { ...previous }; delete next[id]; return next; });
    try {
      const response = await fetch(`/api/recrutamento/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change),
      });
      const result = await response.json() as { error?: string; stage_updated_at?: string; result?: string };
      if (!response.ok) throw new Error(result.error || "Falha ao guardar a etapa.");
      if (result.result === "updated") {
        setCandidates((previous) => previous.map((item) => item.id === id ? {
          ...item,
          funnel_stage: change.stage,
          stage_updated_at: result.stage_updated_at ?? null,
          stage_note: change.note ?? null,
          recontact_at: change.stage === "not_now" && change.recontact_at ? `${change.recontact_at}T12:00:00.000Z` : null,
        } : item));
      }
      return result.result === "updated" ? result.stage_updated_at ?? new Date().toISOString() : null;
    } catch (error) {
      setErrors((previous) => ({ ...previous, [id]: error instanceof Error ? error.message : "Não foi possível guardar." }));
      return null;
    } finally {
      setPending((previous) => { const next = new Set(previous); next.delete(id); return next; });
    }
  }, []);

  const value = useMemo(() => ({ candidates, pending, errors, updateStage }), [candidates, pending, errors, updateStage]);
  return <RecruitmentContext.Provider value={value}>{children}</RecruitmentContext.Provider>;
}

export function useRecruitment(): RecruitmentContextValue {
  const value = useContext(RecruitmentContext);
  if (!value) throw new Error("useRecruitment requer RecruitmentProvider");
  return value;
}
