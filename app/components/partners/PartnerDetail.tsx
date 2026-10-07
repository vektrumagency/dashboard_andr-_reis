"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PartnerDetailData, segmentLabel } from "@/lib/partners";
import { usePartners } from "@/lib/partnersStore";
import { PartnerQuery, partnerHref, partnerIndexHref } from "@/lib/partnerQuery";
import { StageSelect } from "./PartnersDashboard";

type Adjacency = { prevId: string | null; nextId: string | null; index: number; total: number };

export function PartnerDetail({ partner, query, adjacency, modal = false }: {
  partner: PartnerDetailData;
  query: PartnerQuery;
  adjacency: Adjacency;
  modal?: boolean;
}) {
  const router = useRouter();
  const { partners } = usePartners();
  const current = partners.find((item) => item.id === partner.id) ?? partner;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT" || target?.isContentEditable) return;
      if (modal && event.key === "Escape") router.back();
      if (event.key === "ArrowLeft" && adjacency.prevId) router.replace(partnerHref(adjacency.prevId, query));
      if (event.key === "ArrowRight" && adjacency.nextId) router.replace(partnerHref(adjacency.nextId, query));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [adjacency.prevId, adjacency.nextId, modal, query, router]);

  const evidence = partner.candidate.evidence ?? [];
  return <div className="w-full overflow-hidden rounded-card border border-line bg-surface text-ink shadow-card">
    <div className="border-b border-line bg-surface-sunken px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-gold">Parceiro · {partner.priority} · {partner.score_total}/100</p>
          <h1 className="mt-2 text-2xl font-semibold">{partner.company_name}</h1>
          <p className="mt-1 text-sm text-ink-muted">{segmentLabel(partner.segment)}{partner.candidate.company?.office_location ? ` · ${partner.candidate.company.office_location}` : ""}</p>
        </div>
        <div className="min-w-44"><StageSelect partner={current} /></div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
        {adjacency.index > 0 && <span className="font-mono">{adjacency.index} de {adjacency.total}</span>}
        <Link href={partnerIndexHref(query)} className="hover:text-ink">← Voltar aos parceiros</Link>
        <div className="ml-auto flex gap-2">
          <AdjacentLink id={adjacency.prevId} query={query} label="← Anterior" />
          <AdjacentLink id={adjacency.nextId} query={query} label="Próximo →" />
        </div>
      </div>
    </div>

    <div className="grid gap-5 p-6 md:grid-cols-2">
      <Section title="Empresa e oportunidade">
        <p>{partner.candidate.company?.business_summary || partner.rationale || "Sem descrição."}</p>
        {partner.rationale && <Field label="Porque é relevante" value={partner.rationale} />}
        {partner.candidate.value_proposition && <Field label="Proposta de valor" value={partner.candidate.value_proposition} />}
        {partner.candidate.message_angle && <Field label="Ângulo de abordagem" value={partner.candidate.message_angle} />}
        {partner.candidate.meeting_question && <Field label="Pergunta para reunião" value={partner.candidate.meeting_question} />}
      </Section>
      <div className="flex flex-col gap-5">
        <Section title="Contacto">
          <Field label="Nome" value={partner.contact.name} />
          <Field label="Função" value={partner.contact.role} />
          <Field label="Email" value={partner.contact.business_email ? <a href={`mailto:${partner.contact.business_email}`} className="text-accent hover:underline">{partner.contact.business_email}</a> : null} />
          <Field label="Telefone" value={partner.contact.telephone ? <a href={`tel:${partner.contact.telephone}`} className="text-accent hover:underline">{partner.contact.telephone}</a> : null} />
          {safeUrl(partner.website) && <Field label="Website" value={<a href={partner.website!} target="_blank" rel="noopener noreferrer" className="break-all text-accent hover:underline">{partner.website}</a>} />}
        </Section>
        <Section title="Sinais e cautelas">
          <Notes title="Sinais positivos" items={partner.candidate.known_positive_signals} />
          <Notes title="Cautelas" items={partner.candidate.known_cautions} />
          <Notes title="Por confirmar" items={partner.candidate.critical_unknowns} />
        </Section>
      </div>
      <div className="md:col-span-2">
        <Section title={`Evidência de pesquisa (${evidence.length})`}>
          {evidence.length === 0 ? <p>Sem evidência registada.</p> : <div className="grid gap-3 md:grid-cols-2">
            {evidence.map((item, index) => <div key={`${item.source_url ?? "source"}-${index}`} className="rounded-tile border border-line bg-surface-sunken p-3">
              <p className="text-xs font-semibold text-ink">{item.label || item.relevance || `Fonte ${index + 1}`}</p>
              <p className="mt-1 text-sm text-ink-muted">{item.observation || "Sem observação."}</p>
              {safeUrl(item.source_url) && <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block max-w-full truncate text-xs text-accent hover:underline">Abrir fonte ↗</a>}
            </div>)}
          </div>}
        </Section>
      </div>
    </div>
  </div>;
}

function AdjacentLink({ id, query, label }: { id: string | null; query: PartnerQuery; label: string }) {
  return id ? <Link href={partnerHref(id, query)} replace className="rounded-tile border border-line-strong px-2 py-1 hover:bg-surface-hover hover:text-ink">{label}</Link>
    : <span className="rounded-tile border border-line px-2 py-1 text-ink-faint">{label}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-card border border-line bg-surface-raised p-4 text-sm text-ink-muted"><h2 className="mb-3 text-sm font-semibold text-ink">{title}</h2>{children}</section>;
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return <div className="mt-3"><p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p><div className="mt-1 whitespace-pre-line">{value}</div></div>;
}

function Notes({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return <div className="mt-3"><p className="text-xs font-medium text-ink">{title}</p><ul className="mt-1 list-inside list-disc space-y-1">{items.map((item, index) => <li key={index}>{item}</li>)}</ul></div>;
}

function safeUrl(value?: string | null): boolean {
  if (!value) return false;
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}
