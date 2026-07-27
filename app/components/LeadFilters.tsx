"use client";

import { ALL_PRIORITIES, PRIORITY_LABELS, STATUS_LABELS, ALL_STATUSES } from "@/lib/leads";
import { ALL, LeadQuery } from "@/lib/leadQuery";
import { LeadSearch } from "./LeadSearch";

/**
 * Barra de filtros da tabela — separada de LeadsTable para o shell não
 * ficar sobrecarregado. "Todas" é uma opção real no filtro de estado
 * (antes o ramo estava morto: statusFromParam nunca devolvia "Todas").
 */
export function LeadFilters({
  query,
  zones,
  typologies,
  onChange,
}: {
  query: LeadQuery;
  zones: string[];
  typologies: string[];
  onChange: (patch: Partial<LeadQuery>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <LeadSearch value={query.q} onChange={(q) => onChange({ q })} />
      <div className="flex flex-wrap items-end gap-3">
        <StatusChips value={query.status} onChange={(status) => onChange({ status })} />
        <div className="ml-auto flex flex-wrap gap-3">
          <Filter label="Zona" value={query.zone} onChange={(zone) => onChange({ zone })} options={zones} />
          <Filter
            label="Prioridade"
            value={query.priority}
            onChange={(priority) => onChange({ priority: priority as LeadQuery["priority"] })}
            options={ALL_PRIORITIES}
            labels={PRIORITY_LABELS}
          />
          <Filter
            label="Tipologia"
            value={query.typology}
            onChange={(typology) => onChange({ typology })}
            options={typologies}
          />
        </div>
      </div>
    </div>
  );
}

function StatusChips({
  value,
  onChange,
}: {
  value: LeadQuery["status"];
  onChange: (value: LeadQuery["status"]) => void;
}) {
  const options: LeadQuery["status"][] = [ALL, ...ALL_STATUSES];
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((status) => {
        const active = status === value;
        const label = status === ALL ? ALL : STATUS_LABELS[status];
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={`rounded-pill px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-accent text-canvas"
                : "border border-line-strong text-ink-muted hover:bg-surface-hover hover:text-ink"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Filter<T extends string>({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: T[];
  labels?: Record<T, string>;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-tile border border-line-strong bg-surface px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
      >
        <option value={ALL}>{ALL}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels ? labels[option] : option}
          </option>
        ))}
      </select>
    </label>
  );
}
