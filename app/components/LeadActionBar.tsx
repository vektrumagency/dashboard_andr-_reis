"use client";

import { Lead } from "@/lib/types";

const ACTIONS: {
  status: Lead["status"];
  label: string;
  active: string;
  idle: string;
}[] = [
  {
    status: "not_relevant",
    label: "Não relevante",
    active: "bg-red-500 border-red-500 text-white",
    idle: "border-zinc-200 text-zinc-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50",
  },
  {
    status: "contacted",
    label: "Contactado",
    active: "bg-violet-600 border-violet-600 text-white",
    idle: "border-zinc-200 text-zinc-500 hover:border-violet-200 hover:text-violet-600 hover:bg-violet-50",
  },
  {
    status: "visit",
    label: "Visita agendada",
    active: "bg-orange-500 border-orange-500 text-white",
    idle: "border-zinc-200 text-zinc-500 hover:border-orange-200 hover:text-orange-500 hover:bg-orange-50",
  },
];

export function LeadActionBar({
  status,
  disabled,
  onDecide,
}: {
  status: Lead["status"];
  disabled?: boolean;
  onDecide: (status: Lead["status"]) => void;
}) {
  return (
    <div className="flex gap-2 px-6 py-4">
      {ACTIONS.map((action) => {
        const isActive = status === action.status;
        return (
          <button
            key={action.status}
            type="button"
            aria-pressed={isActive}
            disabled={disabled}
            onClick={() => onDecide(action.status)}
            className={`flex-1 rounded-lg border py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors disabled:cursor-default disabled:opacity-50 ${
              isActive ? action.active : action.idle
            }`}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
