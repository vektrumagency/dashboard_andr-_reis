"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, LayoutGrid, List, Search } from "lucide-react";
import { usePartners } from "@/lib/partnersStore";
import { PARTNER_STAGES, PARTNER_STAGE_LABELS, PartnerListItem, PartnerStage, segmentLabel } from "@/lib/partners";
import { ALL_PARTNERS, PartnerQuery, PartnerSort, applyPartnerQuery, parsePartnerQuery, partnerHref, partnerIndexHref } from "@/lib/partnerQuery";

const PRIORITIES = ["A", "B", "C", "Exclude"] as const;

export function StageSelect({ partner, compact = false }: { partner: PartnerListItem; compact?: boolean }) {
  const { updateStage, pending, errors } = usePartners();
  return (
    <div className="min-w-0" onClick={(event) => event.stopPropagation()}>
      <select
        aria-label={`Estado de ${partner.company_name}`}
        value={partner.funnel_stage}
        disabled={pending.has(partner.id)}
        onChange={(event) => void updateStage(partner.id, event.target.value as PartnerStage)}
        className={`w-full rounded-tile border border-line-strong bg-surface-sunken px-2 text-ink focus:border-accent focus:outline-none disabled:opacity-50 ${compact ? "py-1.5 text-xs" : "py-2 text-sm"}`}
      >
        {PARTNER_STAGES.map((stage) => <option key={stage} value={stage}>{PARTNER_STAGE_LABELS[stage]}</option>)}
      </select>
      {errors[partner.id] && <p role="alert" className="mt-1 text-xs text-negative">{errors[partner.id]}</p>}
    </div>
  );
}

export function PartnersDashboard() {
  const { partners, updateStage } = usePartners();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useMemo(() => parsePartnerQuery(searchParams), [searchParams]);
  const visible = useMemo(() => applyPartnerQuery(partners, query), [partners, query]);
  const segments = useMemo(() => [...new Set(partners.map((partner) => partner.segment))].sort(), [partners]);
  const [dragOver, setDragOver] = useState<PartnerStage | null>(null);

  function updateQuery(patch: Partial<PartnerQuery>) {
    router.replace(partnerIndexHref({ ...query, ...patch }));
  }

  function toggleSort(sort: PartnerSort) {
    updateQuery({ sort, dir: query.sort === sort && query.dir === "desc" ? "asc" : "desc" });
  }

  function onDrop(stage: PartnerStage, event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragOver(null);
    const id = event.dataTransfer.getData("text/plain");
    if (partners.some((partner) => partner.id === id)) {
      void updateStage(id, stage);
      if (query.stage !== ALL_PARTNERS) updateQuery({ stage: ALL_PARTNERS });
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Parceiros</h1>
          <p className="text-sm text-ink-muted">{partners.length} parceiros qualificados · {visible.length} visíveis</p>
        </div>
        <div className="flex rounded-tile border border-line-strong bg-surface p-1" aria-label="Vista dos parceiros">
          <button type="button" onClick={() => updateQuery({ view: "table" })}
            aria-pressed={query.view === "table"}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${query.view === "table" ? "bg-surface-hover text-ink" : "text-ink-muted hover:text-ink"}`}>
            <List size={15} /> Tabela
          </button>
          <button type="button" onClick={() => updateQuery({ view: "kanban" })}
            aria-pressed={query.view === "kanban"}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${query.view === "kanban" ? "bg-surface-hover text-ink" : "text-ink-muted hover:text-ink"}`}>
            <LayoutGrid size={15} /> Kanban
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="relative min-w-60 flex-1">
          <span className="sr-only">Pesquisar parceiros</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={query.q} onChange={(event) => updateQuery({ q: event.target.value })}
            placeholder="Pesquisar empresa, contacto ou segmento"
            className="w-full rounded-tile border border-line-strong bg-surface py-2 pl-10 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none" />
        </label>
        <Filter label="Etapa" value={query.stage} onChange={(stage) => updateQuery({ stage: stage as PartnerQuery["stage"] })}
          options={PARTNER_STAGES.map((stage) => ({ value: stage, label: PARTNER_STAGE_LABELS[stage] }))} />
        <Filter label="Segmento" value={query.segment} onChange={(segment) => updateQuery({ segment })}
          options={segments.map((segment) => ({ value: segment, label: segmentLabel(segment) }))} />
        <Filter label="Prioridade" value={query.priority} onChange={(priority) => updateQuery({ priority: priority as PartnerQuery["priority"] })}
          options={PRIORITIES.map((priority) => ({ value: priority, label: priority }))} />
        {query.view === "kanban" && <Filter label="Ordenar" value={`${query.sort}:${query.dir}`} onChange={(value) => {
          const [sort, dir] = value.split(":");
          updateQuery({ sort: sort as PartnerSort, dir: dir as PartnerQuery["dir"] });
        }} options={[
          { value: "score:desc", label: "Score ↓" }, { value: "score:asc", label: "Score ↑" },
          { value: "company:asc", label: "Empresa A–Z" }, { value: "company:desc", label: "Empresa Z–A" },
          { value: "updated:desc", label: "Atualização recente" }, { value: "updated:asc", label: "Atualização antiga" },
        ]} />}
      </div>

      {query.view === "table" ? (
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[1.7fr_1fr_1.2fr_90px_86px_1fr] gap-3 px-4 py-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
              <SortHeader label="Empresa" sort="company" query={query} onClick={toggleSort} />
              <span>Segmento</span><span>Contacto</span><span>Prioridade</span>
              <SortHeader label="Score" sort="score" query={query} onClick={toggleSort} />
              <span>Estado</span>
            </div>
            <div className="flex flex-col gap-2">
              {visible.map((partner) => <div key={partner.id} className="grid grid-cols-[1.7fr_1fr_1.2fr_90px_86px_1fr] items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-sm text-ink hover:border-line-strong hover:bg-surface-hover">
                <Link href={partnerHref(partner.id, query)} className="min-w-0 font-medium hover:text-accent">
                  <span className="block truncate">{partner.company_name}</span>
                  <span className="block truncate text-xs font-normal text-ink-faint">{partner.company_domain || "Ver detalhe"}</span>
                </Link>
                <span className="text-ink-muted">{segmentLabel(partner.segment)}</span>
                <span className="truncate text-ink-muted">{partner.contact.name || partner.contact.business_email || "—"}</span>
                <span className="font-mono text-xs text-ink-muted">{partner.priority}</span>
                <span className="font-mono font-semibold text-gold">{partner.score_total}</span>
                <StageSelect partner={partner} compact />
              </div>)}
              {visible.length === 0 && <EmptyState />}
            </div>
            <button type="button" onClick={() => toggleSort("updated")}
              className="mt-3 flex items-center gap-1 text-xs text-ink-faint hover:text-ink-muted">
              Ordenar por atualização {query.sort === "updated" ? query.dir === "asc" ? "↑" : "↓" : ""}
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto pb-3">
          <div className="grid min-w-[1320px] grid-cols-6 gap-3">
            {PARTNER_STAGES.map((stage) => {
              const cards = visible.filter((partner) => partner.funnel_stage === stage);
              return <section key={stage} aria-label={PARTNER_STAGE_LABELS[stage]}
                onDragOver={(event) => { event.preventDefault(); setDragOver(stage); }}
                onDragLeave={() => setDragOver((previous) => previous === stage ? null : previous)}
                onDrop={(event) => onDrop(stage, event)}
                className={`min-h-52 rounded-card border p-3 ${dragOver === stage ? "border-accent bg-accent-soft" : "border-line bg-surface-sunken"}`}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-ink">{PARTNER_STAGE_LABELS[stage]}</h2>
                  <span className="font-mono text-xs text-ink-faint">{cards.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {cards.map((partner) => <div key={partner.id} draggable
                    onDragStart={(event) => { event.dataTransfer.setData("text/plain", partner.id); event.dataTransfer.effectAllowed = "move"; }}
                    className="rounded-tile border border-line bg-surface p-3 text-sm shadow-card hover:border-line-strong">
                    <Link href={partnerHref(partner.id, query)} className="block font-medium text-ink hover:text-accent">{partner.company_name}</Link>
                    <p className="mt-1 text-xs text-ink-muted">{segmentLabel(partner.segment)}</p>
                    <p className="mt-2 truncate text-xs text-ink-faint">{partner.contact.name || partner.contact.business_email || "Sem contacto"}</p>
                    <div className="mt-3 flex items-center justify-between font-mono text-xs text-ink-muted">
                      <span>{partner.priority}</span><span className="text-gold">{partner.score_total}/100</span>
                    </div>
                    <div className="mt-3"><StageSelect partner={partner} compact /></div>
                  </div>)}
                </div>
              </section>;
            })}
          </div>
        </div>
      )}
    </main>
  );
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
    {label}
    <select value={value} onChange={(event) => onChange(event.target.value)}
      className="rounded-tile border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none">
      <option value={ALL_PARTNERS}>Todas</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}

function SortHeader({ label, sort, query, onClick }: { label: string; sort: PartnerSort; query: PartnerQuery; onClick: (sort: PartnerSort) => void }) {
  const Icon = query.sort === sort && query.dir === "asc" ? ChevronUp : ChevronDown;
  return <button type="button" onClick={() => onClick(sort)} className="flex items-center gap-1 text-left hover:text-ink">
    {label}<Icon size={12} className={query.sort === sort ? "opacity-100" : "opacity-0"} />
  </button>;
}

function EmptyState() {
  return <div className="rounded-card border border-line bg-surface px-4 py-8 text-center text-sm text-ink-muted">Nenhum parceiro corresponde aos filtros selecionados.</div>;
}
