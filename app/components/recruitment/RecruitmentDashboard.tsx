"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, Search } from "lucide-react";
import { useRecruitment } from "@/lib/recruitmentStore";
import { RecruitmentListItem, RECRUITMENT_STAGES, RECRUITMENT_STAGE_LABELS, recruitmentSegmentLabel, recruitmentTabFor } from "@/lib/recruitment";
import { ALL_RECRUITMENT, RecruitmentQuery, applyRecruitmentQuery, parseRecruitmentQuery, recruitmentHref, recruitmentIndexHref } from "@/lib/recruitmentQuery";

const TABS = [
  { value: "outreach", label: "Qualificados completos" },
  { value: "enrichment", label: "Falta email/LinkedIn" },
  { value: "rejected", label: "Rejeitados" },
] as const;

export function RecruitmentDashboard() {
  const { candidates } = useRecruitment();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useMemo(() => parseRecruitmentQuery(searchParams), [searchParams]);
  const visible = useMemo(() => applyRecruitmentQuery(candidates, query), [candidates, query]);
  const segments = useMemo(() => [...new Set(candidates.filter((item) => recruitmentTabFor(item) === query.tab).map((item) => item.segment))].sort(), [candidates, query.tab]);

  function updateQuery(patch: Partial<RecruitmentQuery>) {
    router.replace(recruitmentIndexHref({ ...query, ...patch }));
  }

  return <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Recrutamento</h1>
        <p className="mt-1 text-sm text-ink-muted">{candidates.length} candidatos pesquisados · {visible.length} visíveis</p>
      </div>
      <div className="flex rounded-tile border border-line-strong bg-surface p-1" aria-label="Vista dos candidatos">
        <button type="button" onClick={() => updateQuery({ view: "table" })} aria-pressed={query.view === "table"}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${query.view === "table" ? "bg-surface-hover text-ink" : "text-ink-muted hover:text-ink"}`}><List size={15} /> Tabela</button>
        <button type="button" onClick={() => updateQuery({ view: "kanban" })} aria-pressed={query.view === "kanban"}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${query.view === "kanban" ? "bg-surface-hover text-ink" : "text-ink-muted hover:text-ink"}`}><LayoutGrid size={15} /> Kanban</button>
      </div>
    </div>

    <div role="tablist" aria-label="Estado da pesquisa" className="flex flex-wrap gap-2 border-b border-line pb-3">
      {TABS.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={query.tab === tab.value}
        onClick={() => updateQuery({ tab: tab.value, stage: ALL_RECRUITMENT, priority: ALL_RECRUITMENT, segment: ALL_RECRUITMENT })}
        className={`rounded-tile px-3 py-2 text-sm transition-colors ${query.tab === tab.value ? "bg-surface-raised text-ink" : "text-ink-muted hover:bg-surface hover:text-ink"}`}>
        {tab.label} <span className="ml-1 font-mono text-xs text-ink-faint">{candidates.filter((item) => recruitmentTabFor(item) === tab.value).length}</span>
      </button>)}
    </div>

    <div className="flex flex-wrap items-end gap-3">
      <label className="relative min-w-60 flex-1">
        <span className="sr-only">Pesquisar candidatos</span>
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input value={query.q} onChange={(event) => updateQuery({ q: event.target.value })} placeholder="Pesquisar nome, função, empresa ou zona"
          className="w-full rounded-tile border border-line-strong bg-surface py-2 pl-10 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none" />
      </label>
      <Filter label="Etapa" value={query.stage} onChange={(stage) => updateQuery({ stage: stage as RecruitmentQuery["stage"] })}
        options={RECRUITMENT_STAGES.map((stage) => ({ value: stage, label: RECRUITMENT_STAGE_LABELS[stage] }))} />
      <Filter label="Segmento" value={query.segment} onChange={(segment) => updateQuery({ segment })}
        options={segments.map((segment) => ({ value: segment, label: recruitmentSegmentLabel(segment) }))} />
      <Filter label="Prioridade" value={query.priority} onChange={(priority) => updateQuery({ priority: priority as RecruitmentQuery["priority"] })}
        options={(query.tab === "rejected" ? ["C", "Exclude"] : ["A", "B"]).map((priority) => ({ value: priority, label: priority }))} />
      <Filter label="Ordenar" value={query.sort} onChange={(sort) => updateQuery({ sort: sort as RecruitmentQuery["sort"] })}
        options={[{ value: "score", label: "Score ↓" }, { value: "name", label: "Nome A–Z" }, { value: "updated", label: "Pesquisa recente" }, { value: "recontact", label: "Recontacto próximo" }]} />
    </div>

    {query.view === "table" ? <div className="overflow-x-auto">
      <div className="min-w-[850px]">
        <div className="grid grid-cols-[1.5fr_1.2fr_1fr_75px_65px_1fr] gap-3 px-4 py-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
          <span>Candidato</span><span>Segmento</span><span>Contacto</span><span>Prior.</span><span>Score</span><span>Etapa</span>
        </div>
        <div className="flex flex-col gap-2">
          {visible.map((item) => <Link key={item.id} href={recruitmentHref(item.id, query)}
            className="grid grid-cols-[1.5fr_1.2fr_1fr_75px_65px_1fr] items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-sm text-ink hover:border-line-strong hover:bg-surface-hover">
            <span className="min-w-0"><span className="block truncate font-medium">{item.full_name || "Nome por confirmar"}</span><span className="block truncate text-xs text-ink-faint">{item.professional_role || item.current_affiliation || item.geographic_area || "Sem função indicada"}</span></span>
            <span className="truncate text-ink-muted">{recruitmentSegmentLabel(item.segment)}</span>
            <span className="truncate text-ink-muted">{contactSummary(item)}</span>
            <span className="font-mono text-xs text-ink-muted">{item.priority}</span>
            <span className="font-mono font-semibold text-gold">{item.score_total}</span>
            <StageBadge item={item} />
          </Link>)}
          {visible.length === 0 && <EmptyState tab={query.tab} />}
        </div>
      </div>
    </div> : <div className="overflow-x-auto pb-3">
      <div className="grid min-w-[1850px] grid-cols-11 gap-3">
        {RECRUITMENT_STAGES.map((stage) => {
          const cards = visible.filter((item) => item.funnel_stage === stage);
          return <section key={stage} aria-label={RECRUITMENT_STAGE_LABELS[stage]} className="min-h-52 rounded-card border border-line bg-surface-sunken p-3">
            <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-sm font-semibold text-ink">{RECRUITMENT_STAGE_LABELS[stage]}</h2><span className="font-mono text-xs text-ink-faint">{cards.length}</span></div>
            <div className="flex flex-col gap-2">{cards.map((item) => <Link key={item.id} href={recruitmentHref(item.id, query)} className="rounded-tile border border-line bg-surface p-3 text-sm shadow-card hover:border-line-strong">
              <span className="block font-medium text-ink">{item.full_name || "Nome por confirmar"}</span>
              <span className="mt-1 block text-xs text-ink-muted">{recruitmentSegmentLabel(item.segment)}</span>
              <span className="mt-2 block truncate text-xs text-ink-faint">{contactSummary(item)}</span>
              {item.recontact_at && <span className="mt-2 block text-xs text-gold">Voltar: {formatDate(item.recontact_at)}</span>}
              <span className="mt-3 flex justify-between font-mono text-xs text-ink-muted"><span>{item.priority}</span><span className="text-gold">{item.score_total}/100</span></span>
            </Link>)}</div>
          </section>;
        })}
      </div>
    </div>}
  </main>;
}

function contactSummary(item: RecruitmentListItem): string {
  if (item.funnel_stage === "opted_out") return "Não contactar";
  if (item.lead_completeness === "needs_enrichment") return `Falta ${item.missing_fields.map(missingLabel).join(", ") || "contacto verificado"}`;
  return item.email || "Email verificado";
}

function missingLabel(field: string): string {
  return ({ full_name: "nome", email: "email", linkedin_url: "LinkedIn" } as Record<string, string>)[field] ?? field;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function StageBadge({ item }: { item: RecruitmentListItem }) {
  const tone = item.funnel_stage === "opted_out" ? "bg-negative-soft text-negative" : item.funnel_stage === "joined" ? "bg-positive-soft text-positive" : item.funnel_stage === "not_now" ? "bg-warning-soft text-warning" : "bg-surface-raised text-ink-muted";
  return <span className={`w-fit rounded-pill px-2 py-1 text-xs ${tone}`}>{RECRUITMENT_STAGE_LABELS[item.funnel_stage]}</span>;
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">{label}
    <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-tile border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none">
      <option value={ALL_RECRUITMENT}>Todos</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}

function EmptyState({ tab }: { tab: RecruitmentQuery["tab"] }) {
  const message = tab === "outreach" ? "Ainda não há candidatos qualificados com contacto completo." : tab === "enrichment" ? "Nenhum candidato aguarda enriquecimento." : "Nenhum candidato rejeitado corresponde aos filtros.";
  return <div className="rounded-card border border-line bg-surface px-4 py-10 text-center text-sm text-ink-muted">{message}</div>;
}
