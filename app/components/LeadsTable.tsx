"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Lead } from "@/lib/types";
import { uniqueTypologies, uniqueZones } from "@/lib/leads";
import { LeadQuery, SortKey, applyLeadQuery, leadQueryToSearchParams, parseLeadQuery } from "@/lib/leadQuery";
import { LeadFilters } from "./LeadFilters";
import { LeadRow, GRID_COLS } from "./LeadRow";

/**
 * Todo o estado de filtragem/ordenação vive na URL (via lib/leadQuery),
 * não em useState — é o que corrige as setas ‹ › do detalhe, que antes
 * saltavam de secção porque o filtro nunca chegava à rota /leads/[id].
 * Ver lib/leadQuery.ts#adjacentInQuery.
 */
export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useMemo(() => parseLeadQuery(searchParams), [searchParams]);

  const zones = useMemo(() => uniqueZones(leads), [leads]);
  const typologies = useMemo(() => uniqueTypologies(leads), [leads]);
  const filtered = useMemo(() => applyLeadQuery(leads, query), [leads, query]);

  function updateQuery(patch: Partial<LeadQuery>) {
    // replace, não push — cada tecla na pesquisa ou troca de filtro não
    // deve empilhar uma entrada de histórico própria.
    const next = leadQueryToSearchParams({ ...query, ...patch });
    const qs = next.toString();
    router.replace(qs ? `/?${qs}` : "/");
  }

  function toggleSort(sort: SortKey) {
    if (query.sort === sort) {
      updateQuery({ dir: query.dir === "desc" ? "asc" : "desc" });
    } else {
      updateQuery({ sort, dir: "desc" });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <LeadFilters query={query} zones={zones} typologies={typologies} onChange={updateQuery} />

      <div className="overflow-x-auto">
        <div className="min-w-[960px]">
          <div className={`grid ${GRID_COLS} gap-3 px-3 py-2 text-xs font-medium uppercase tracking-wide text-ink-faint`}>
            <span>Foto</span>
            <span>Imóvel</span>
            <SortableHeader label="Preço" sortKey="price" query={query} onSort={toggleSort} />
            <SortableHeader label="Mercado" sortKey="price_vs_market" query={query} onSort={toggleSort} />
            <span>Agência</span>
            <span>Estado do imóvel</span>
            <SortableHeader label="Score" sortKey="score" query={query} onSort={toggleSort} />
            <span>Estado</span>
          </div>

          <div className="flex flex-col gap-2">
            {filtered.map((lead) => (
              <LeadRow key={lead.id} lead={lead} query={query} />
            ))}
            {filtered.length === 0 && (
              <div className="rounded-card border border-line bg-surface px-4 py-8 text-center text-sm text-ink-muted">
                Nenhum lead corresponde aos filtros selecionados.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  query,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  query: LeadQuery;
  onSort: (key: SortKey) => void;
}) {
  const active = query.sort === sortKey;
  const Icon = active && query.dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 text-left transition-colors ${active ? "text-ink" : "text-ink-faint hover:text-ink-muted"}`}
    >
      {label}
      <Icon size={12} strokeWidth={2.5} className={active ? "opacity-100" : "opacity-0"} />
    </button>
  );
}
