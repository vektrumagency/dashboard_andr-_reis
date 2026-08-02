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
  {
    status: "locating",
    label: "Localizar",
    icon: MapPin,
    active: "bg-accent border-accent text-canvas",
    idle: "border-accent text-accent hover:bg-accent-soft",
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
    <div className="flex flex-wrap gap-2 px-6 py-4">
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
