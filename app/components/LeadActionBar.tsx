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
  localizationStatus,
  disabled,
  onDecide,
  onLocate,
  onCancelLocalization,
}: {
  status: Lead["status"];
  localizationStatus?: "processing" | "answered";
  disabled?: boolean;
  onDecide: (status: Lead["status"]) => void;
  onLocate: () => void;
  onCancelLocalization: () => void;
}) {
  if (status === "locating" && localizationStatus === "processing") {
    return (
      <div className="flex px-6 py-4">
        <button
          type="button"
          disabled={disabled}
          onClick={onCancelLocalization}
          className="w-full rounded-lg border border-zinc-300 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-wait disabled:opacity-50"
        >
          {disabled ? "A atualizar…" : "Cancelar pedido"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 px-6 py-4">
      {status !== "locating" && (
        <button
          type="button"
          disabled={disabled}
          onClick={onLocate}
          className="min-w-32 flex-1 rounded-lg border border-cyan-200 py-2.5 text-xs font-semibold uppercase tracking-wide text-cyan-700 transition-colors hover:bg-cyan-50 disabled:cursor-wait disabled:opacity-50"
        >
          {disabled ? "A enviar…" : "Localizar"}
        </button>
      )}
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
