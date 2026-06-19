"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lead } from "@/lib/types";
import { formatArea, formatPrice, priceDropPercent } from "@/lib/format";
import { ALL_PRIORITIES, ALL_STATUSES, uniqueTypologies, uniqueZones } from "@/lib/leads";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

const ALL = "Todas";

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [zone, setZone] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [typology, setTypology] = useState(ALL);

  const zones = useMemo(() => uniqueZones(leads), [leads]);
  const typologies = useMemo(() => uniqueTypologies(leads), [leads]);

  const filtered = useMemo(() => {
    return leads
      .filter((lead) => zone === ALL || lead.zone === zone)
      .filter((lead) => priority === ALL || lead.priority === priority)
      .filter((lead) => status === ALL || lead.status === status)
      .filter((lead) => typology === ALL || lead.typology === typology)
      .sort((a, b) => b.score - a.score);
  }, [leads, zone, priority, status, typology]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Filter label="Zona" value={zone} onChange={setZone} options={zones} />
        <Filter
          label="Prioridade"
          value={priority}
          onChange={setPriority}
          options={ALL_PRIORITIES}
        />
        <Filter label="Estado" value={status} onChange={setStatus} options={ALL_STATUSES} />
        <Filter
          label="Tipologia"
          value={typology}
          onChange={setTypology}
          options={typologies}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Zona</th>
              <th className="px-4 py-3">Tipologia</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Dias no mercado</th>
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((lead) => {
              const drop = priceDropPercent(lead.price_current, lead.price_initial);
              return (
                <tr
                  key={lead.id}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  className="cursor-pointer hover:bg-zinc-50"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-zinc-900">{lead.zone}</span>
                    <span className="block text-xs text-zinc-500">
                      {lead.seller_type === "particular" ? "Particular" : "Agência"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{lead.typology}</td>
                  <td className="px-4 py-3">
                    {formatPrice(lead.price_current)}
                    {drop > 0 && (
                      <span className="ml-1.5 text-xs font-medium text-emerald-600">
                        -{drop}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatArea(lead.area_sqm)}</td>
                  <td className="px-4 py-3">{lead.days_on_market}</td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={lead.priority} />
                  </td>
                  <td className="px-4 py-3">{lead.score}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  Nenhum lead corresponde aos filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
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
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
