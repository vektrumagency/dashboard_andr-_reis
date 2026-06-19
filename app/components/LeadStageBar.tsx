"use client";

import { useState } from "react";
import { Lead } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/leads";

const STAGES: Lead["status"][] = ["new", "saved", "contacted", "visit"];

export function LeadStageBar({ status }: { status: Lead["status"] }) {
  const [currentStatus, setCurrentStatus] = useState(status);

  if (currentStatus === "not_relevant") {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-600">
        Não relevante
      </span>
    );
  }

  const stageIndex = STAGES.indexOf(currentStatus);

  return (
    <div className="grid grid-cols-4 gap-2">
      {STAGES.map((stage, i) => (
        <button
          key={stage}
          type="button"
          onClick={() => setCurrentStatus(stage)}
          aria-label={`Marcar como ${STATUS_LABELS[stage]}`}
          className="flex flex-col gap-1.5 text-left"
        >
          <div
            className={`h-1.5 rounded-full transition-colors hover:opacity-70 ${
              i <= stageIndex ? "bg-zinc-900" : "bg-zinc-200"
            }`}
          />
          <span
            className={`text-[10px] font-medium uppercase tracking-wide ${
              i === stageIndex ? "text-zinc-900" : "text-zinc-400"
            }`}
          >
            {STATUS_LABELS[stage]}
          </span>
        </button>
      ))}
    </div>
  );
}
