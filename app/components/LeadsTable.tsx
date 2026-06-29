"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lead, LeadStatus } from "@/lib/types";
import { formatArea, formatPrice } from "@/lib/format";
import {
  ALL_PRIORITIES,
  ALL_STATUSES,
  PRIORITY_LABELS,
  searchLeads,
  uniqueTypologies,
  uniqueZones,
} from "@/lib/leads";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";
import { scoreColor } from "@/lib/scoreColor";
import { LeadSearch } from "./LeadSearch";

const ALL = "Todas";

const GRID_COLS = "grid-cols-[1.4fr_0.8fr_1fr_0.8fr_1fr_0.9fr_0.6fr_0.9fr]";

function statusFromParam(value: string | null): string {
  if (value && ALL_STATUSES.includes(value as LeadStatus)) return value;
  return "new";
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [status, setStatus] = useState(() => statusFromParam(searchParams.get("status")));
  const [typology, setTypology] = useState(ALL);

  useEffect(() => {
    setStatus(statusFromParam(searchParams.get("status")));
  }, [searchParams]);

  const zones = useMemo(() => uniqueZones(leads), [leads]);
  const typologies = useMemo(() => uniqueTypologies(leads), [leads]);

  const filtered = useMemo(() => {
    return searchLeads(leads, search)
      .filter((lead) => zone === ALL || lead.property.zone === zone)
      .filter((lead) => priority === ALL || lead.priority === priority)
      .filter((lead) => status === ALL || lead.status === status)
      .filter((lead) => typology === ALL || lead.property.typology === typology)
      .sort((a, b) => b.score - a.score);
  }, [leads, search, zone, priority, status, typology]);

  return (
    <div className="flex flex-col gap-4">
      <LeadSearch value={search} onChange={setSearch} />
      <div className="flex flex-wrap gap-3">
        <Filter label="Zona" value={zone} onChange={setZone} options={zones} />
        <Filter
          label="Prioridade"
          value={priority}
          onChange={setPriority}
          options={ALL_PRIORITIES}
          labels={PRIORITY_LABELS}
        />
        <Filter label="Tipologia" value={typology} onChange={setTypology} options={typologies} />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div
            className={`grid ${GRID_COLS} gap-2 px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500`}
          >
            <span>Zona</span>
            <span>Tipologia</span>
            <span>Preço</span>
            <span>Área</span>
            <span>Dias no mercado</span>
            <span>Prioridade</span>
            <span>Score</span>
            <span>Estado</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {filtered.map((lead) => {
              const drop = lead.property.price_reduction_pct;
              return (
                <div
                  key={lead.id}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  className={`grid ${GRID_COLS} items-center gap-2 rounded-full bg-zinc-100 px-6 py-3 text-sm text-zinc-900 cursor-pointer transition-transform hover:scale-[1.01]`}
                >
                  <div>
                    <span className="font-medium text-zinc-900">{lead.property.zone}</span>
                    <span className="block text-xs text-zinc-500">
                      {lead.seller.type === "private"
                        ? "Particular"
                        : lead.seller.type === "agency"
                          ? "Agência"
                          : lead.seller.type === "promoter"
                            ? "Promotor"
                            : "Desconhecido"}
                    </span>
                  </div>
                  <div className="text-zinc-700">{lead.property.typology}</div>
                  <div className="font-medium">
                    {formatPrice(lead.property.price_current)}
                    {!!drop && drop > 0 && (
                      <span className="ml-1.5 text-xs font-semibold text-emerald-600">
                        -{Math.round(drop)}%
                      </span>
                    )}
                  </div>
                  <div className="text-zinc-700">{formatArea(lead.property.area_sqm)}</div>
                  <div className="text-zinc-700">{lead.property.days_on_market ?? "—"}</div>
                  <div>
                    <PriorityBadge priority={lead.priority} />
                  </div>
                  <div className={`font-semibold ${scoreColor(lead.score)}`}>{lead.score}</div>
                  <div>
                    <StatusBadge status={lead.status} />
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500">
                Nenhum lead corresponde aos filtros selecionados.
              </div>
            )}
          </div>
        </div>
      </div>
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
    <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
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
