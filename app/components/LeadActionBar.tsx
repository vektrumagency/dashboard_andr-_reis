"use client";

import { Bookmark, CalendarCheck, MapPin, Phone, X } from "lucide-react";
import { Lead } from "@/lib/types";

/**
 * "saved" tinha rótulo, cor e entrada na sidebar mas nenhum botão o
 * definia — Guardar torna esse estado alcançável, útil num CRM em que
 * nem toda a decisão é "contactar" ou "rejeitar" de imediato.
 */
const ACTIONS: {
  status: Lead["status"];
  label: string;
  icon: typeof Bookmark;
  active: string;
  idle: string;
}[] = [
  {
    status: "saved",
    label: "Guardar",
    icon: Bookmark,
    active: "bg-status-saved border-status-saved text-canvas",
    idle: "border-line-strong text-ink-muted hover:border-status-saved hover:text-status-saved hover:bg-status-saved/10",
  },
  {
    status: "contacted",
    label: "Contactado",
    icon: Phone,
    active: "bg-status-contacted border-status-contacted text-canvas",
    idle: "border-line-strong text-ink-muted hover:border-status-contacted hover:text-status-contacted hover:bg-status-contacted/10",
  },
  {
    status: "visit",
    label: "Visita agendada",
    icon: CalendarCheck,
    active: "bg-status-visit border-status-visit text-canvas",
    idle: "border-line-strong text-ink-muted hover:border-status-visit hover:text-status-visit hover:bg-status-visit/10",
  },
  {
    status: "not_relevant",
    label: "Não relevante",
    icon: X,
    active: "bg-negative border-negative text-canvas",
    idle: "border-line-strong text-ink-muted hover:border-negative hover:text-negative hover:bg-negative/10",
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
          className="w-full rounded-tile border border-line-strong py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted transition-colors hover:bg-surface-hover disabled:cursor-wait disabled:opacity-50"
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
          className="flex min-w-32 flex-1 items-center justify-center gap-1.5 rounded-tile border border-accent py-2.5 text-xs font-semibold uppercase tracking-wide text-accent transition-colors hover:bg-accent-soft disabled:cursor-wait disabled:opacity-50"
        >
          <MapPin size={14} strokeWidth={2} />
          {disabled ? "A enviar…" : "Localizar"}
        </button>
      )}
      {ACTIONS.map((action) => {
        const isActive = status === action.status;
        const Icon = action.icon;
        return (
          <button
            key={action.status}
            type="button"
            aria-pressed={isActive}
            disabled={disabled}
            onClick={() => onDecide(action.status)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-tile border py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors disabled:cursor-default disabled:opacity-50 ${
              isActive ? action.active : action.idle
            }`}
          >
            <Icon size={14} strokeWidth={2} />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
