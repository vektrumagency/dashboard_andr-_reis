"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRecruitment } from "@/lib/recruitmentStore";
import { RecruitmentDetailData, RecruitmentStageEvent, RECRUITMENT_STAGES, RECRUITMENT_STAGE_LABELS, recruitmentSegmentLabel } from "@/lib/recruitment";
import { RecruitmentQuery, recruitmentIndexHref } from "@/lib/recruitmentQuery";

export function RecruitmentDetail({ candidate, query }: { candidate: RecruitmentDetailData; query: RecruitmentQuery }) {
  const { candidates, pending, errors, updateStage } = useRecruitment();
  const current = candidates.find((item) => item.id === candidate.id) ?? candidate;
  const [selectedStage, setSelectedStage] = useState(current.funnel_stage);
  const [note, setNote] = useState("");
  const [recontactAt, setRecontactAt] = useState(current.recontact_at?.slice(0, 10) ?? "");
  const [history, setHistory] = useState<RecruitmentStageEvent[]>(candidate.stage_history);
  const noContact = current.funnel_stage === "opted_out" || current.status === "rejected";

  async function saveStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedStage === current.funnel_stage || current.funnel_stage === "opted_out") return;
    const changedAt = await updateStage(candidate.id, {
      stage: selectedStage,
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(selectedStage === "not_now" ? { recontact_at: recontactAt } : {}),
    });
    if (changedAt) {
      setHistory((previous) => [...previous, {
        stage: selectedStage,
        changed_at: changedAt,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(selectedStage === "not_now" ? { recontact_at: `${recontactAt}T12:00:00.000Z` } : {}),
      }]);
      setNote("");
    }
  }

  return <article className="w-full overflow-hidden rounded-card border border-line bg-surface text-ink shadow-card">
    <header className="border-b border-line bg-surface-sunken px-6 py-5">
      <p className="font-mono text-xs uppercase tracking-widest text-gold">Recrutamento · {current.priority} · {current.score_total}/100</p>
      <h1 className="mt-2 text-2xl font-semibold">{current.full_name || "Nome por confirmar"}</h1>
      <p className="mt-1 text-sm text-ink-muted">{current.professional_role || "Função por confirmar"}{current.current_affiliation ? ` · ${current.current_affiliation}` : ""}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <Badge>{recruitmentSegmentLabel(current.segment)}</Badge>
        <Badge>{current.status === "qualified" ? "Qualificado" : "Rejeitado"}</Badge>
        <Badge>{current.lead_completeness === "complete" ? "Contacto completo" : "Precisa de enriquecimento"}</Badge>
        <Badge>{RECRUITMENT_STAGE_LABELS[current.funnel_stage]}</Badge>
      </div>
      <Link href={recruitmentIndexHref(query)} className="mt-5 inline-block text-xs text-ink-muted hover:text-ink">← Voltar ao recrutamento</Link>
    </header>

    <div className="grid gap-5 p-6 md:grid-cols-2">
      <section className="rounded-card border border-line bg-surface-raised p-4 text-sm text-ink-muted">
        <h2 className="mb-3 text-sm font-semibold text-ink">Pesquisa</h2>
        <Field label="Segmento" value={recruitmentSegmentLabel(current.segment)} />
        <Field label="Prioridade e score" value={`${current.priority} · ${current.score_total}/100`} />
        <Field label="Zona" value={current.geographic_area} />
        <Field label="Estado da pesquisa" value={current.status === "qualified" ? "Qualificado" : "Rejeitado"} />
        <Field label="Completude" value={current.lead_completeness === "complete" ? "Completo" : "Precisa de enriquecimento"} />
        {current.missing_fields.length > 0 && <Field label="Campos em falta" value={current.missing_fields.map(missingLabel).join(", ")} />}
        <Field label="Origem do email" value={current.email_origin === "public_source" ? "Fonte pública" : current.email_origin === "enrichment_provider" ? "Fornecedor de enriquecimento" : "Não indicada"} />
        <Field label="Data da pesquisa" value={candidate.research_date} />
        <Field label="Justificação" value={candidate.rationale} />
        <Field label="Motivo de rejeição" value={candidate.rejection_reason} />
        <Field label="Resumo profissional" value={candidate.candidate.professional_summary} />
        <Field label="Experiência" value={candidate.candidate.experience_summary} />
      </section>

      <div className="flex flex-col gap-5">
        <section className="rounded-card border border-line bg-surface-raised p-4 text-sm text-ink-muted">
          <h2 className="mb-3 text-sm font-semibold text-ink">Contacto</h2>
          {noContact && <p className="mb-3 rounded-tile bg-negative-soft p-3 text-negative">{current.funnel_stage === "opted_out" ? "Pediu para não ser contactado. Contactos desativados." : "Candidato rejeitado. Contactos desativados."}</p>}
          <Field label="Email" value={current.email && !noContact ? <a href={`mailto:${current.email}`} className="text-accent hover:underline">{current.email}</a> : current.email} />
          <Field label="LinkedIn" value={current.linkedin_url && safeUrl(current.linkedin_url) && !noContact ? <a href={current.linkedin_url} target="_blank" rel="noopener noreferrer" className="break-all text-accent hover:underline">Abrir perfil ↗</a> : current.linkedin_url} />
          <Field label="Telefone" value={candidate.candidate.public_professional_phone && !noContact ? <a href={`tel:${candidate.candidate.public_professional_phone}`} className="text-accent hover:underline">{candidate.candidate.public_professional_phone}</a> : candidate.candidate.public_professional_phone} />
          <Field label="Instagram" value={candidate.instagram_url && safeUrl(candidate.instagram_url) && !noContact ? <a href={candidate.instagram_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Abrir perfil ↗</a> : candidate.instagram_url} />
          <Field label="Website profissional" value={candidate.professional_website && safeUrl(candidate.professional_website) && !noContact ? <a href={candidate.professional_website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Abrir site ↗</a> : candidate.professional_website} />
          {current.recontact_at && <Field label="Voltar a contactar" value={formatDate(current.recontact_at)} />}
        </section>

        <section className="rounded-card border border-line bg-surface-raised p-4 text-sm text-ink-muted">
          <h2 className="mb-3 text-sm font-semibold text-ink">Etapa do funil</h2>
          {current.funnel_stage === "opted_out" ? <p>Esta etapa é definitiva. O candidato não deve voltar a ser contactado.</p> : <form onSubmit={(event) => void saveStage(event)} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">Nova etapa
              <select value={selectedStage} onChange={(event) => setSelectedStage(event.target.value as typeof selectedStage)}
                className="rounded-tile border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none">
                {RECRUITMENT_STAGES.map((stage) => <option key={stage} value={stage}>{RECRUITMENT_STAGE_LABELS[stage]}</option>)}
              </select>
            </label>
            {selectedStage === "not_now" && <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">Data para voltar a contactar
              <input type="date" required value={recontactAt} onChange={(event) => setRecontactAt(event.target.value)}
                className="rounded-tile border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none" />
            </label>}
            <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">Nota opcional
              <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={3} placeholder="Contexto da mudança de etapa"
                className="rounded-tile border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none" />
            </label>
            {selectedStage === "opted_out" && <p className="text-xs text-negative">Esta escolha bloqueia futuras mudanças de etapa e ações de contacto.</p>}
            {errors[candidate.id] && <p role="alert" className="text-xs text-negative">{errors[candidate.id]}</p>}
            <button type="submit" disabled={pending.has(candidate.id) || selectedStage === current.funnel_stage}
              className="self-start rounded-tile bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">
              {pending.has(candidate.id) ? "A guardar…" : "Guardar etapa"}
            </button>
          </form>}
          {current.stage_updated_at && <p className="mt-3 text-xs text-ink-faint">Última mudança: {formatDateTime(current.stage_updated_at)}</p>}
        </section>
      </div>

      <section className="rounded-card border border-line bg-surface-raised p-4 text-sm text-ink-muted md:col-span-2">
        <h2 className="mb-3 text-sm font-semibold text-ink">Sinais e cautelas</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Notes title="Sinais positivos" items={candidate.candidate.known_positive_signals} />
          <Notes title="Cautelas" items={candidate.candidate.known_cautions} />
          <Notes title="Por confirmar" items={candidate.candidate.critical_unknowns} />
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface-raised p-4 text-sm text-ink-muted md:col-span-2">
        <h2 className="mb-3 text-sm font-semibold text-ink">Evidência de pesquisa ({candidate.candidate.evidence?.length ?? 0})</h2>
        {candidate.candidate.evidence?.length ? <div className="grid gap-3 md:grid-cols-2">{candidate.candidate.evidence.map((item, index) => <div key={`${item.source_url ?? "source"}-${index}`} className="rounded-tile border border-line bg-surface-sunken p-3">
          <p className="text-xs font-semibold text-ink">{item.label || item.relevance || `Fonte ${index + 1}`}</p>
          <p className="mt-1 whitespace-pre-line">{item.observation || "Sem observação."}</p>
          {item.source_url && safeUrl(item.source_url) && !noContact && <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block max-w-full truncate text-xs text-accent hover:underline">Abrir fonte ↗</a>}
        </div>)}</div> : <p>Sem evidência registada.</p>}
      </section>

      <section className="rounded-card border border-line bg-surface-raised p-4 text-sm text-ink-muted md:col-span-2">
        <h2 className="mb-3 text-sm font-semibold text-ink">Histórico de etapas</h2>
        {history.length ? <ol className="space-y-3">{[...history].reverse().map((event, index) => <li key={`${event.changed_at}-${index}`} className="border-l-2 border-gold pl-3">
          <p className="font-medium text-ink">{RECRUITMENT_STAGE_LABELS[event.stage]} <span className="font-normal text-ink-faint">· {formatDateTime(event.changed_at)}</span></p>
          {event.note && <p className="mt-1 whitespace-pre-line">{event.note}</p>}
          {event.recontact_at && <p className="mt-1 text-xs text-gold">Voltar a contactar: {formatDate(event.recontact_at)}</p>}
        </li>)}</ol> : <p>Sem mudanças de etapa registadas.</p>}
      </section>
    </div>
  </article>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-pill border border-line-strong bg-surface px-2.5 py-1 text-ink-muted">{children}</span>;
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return <div className="mt-3"><p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p><div className="mt-1 whitespace-pre-line break-words">{value}</div></div>;
}

function Notes({ title, items }: { title: string; items?: string[] }) {
  return <div><h3 className="text-xs font-semibold text-ink">{title}</h3>{items?.length ? <ul className="mt-2 list-inside list-disc space-y-1">{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="mt-2 text-xs text-ink-faint">Sem registos.</p>}</div>;
}

function missingLabel(field: string): string {
  return ({ full_name: "nome", email: "email", linkedin_url: "LinkedIn" } as Record<string, string>)[field] ?? field;
}

function safeUrl(value: string): boolean {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(new Date(value));
}
