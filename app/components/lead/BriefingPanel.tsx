"use client";

import { Lead } from "@/lib/types";
import { BriefingItem, BriefingQuestion } from "@/lib/types/analysis";
import { BriefingSection, briefingModel, evidenceSourceLabel } from "@/lib/derive/briefing";
import { confidenceLabel } from "@/lib/derive/enums";
import { cn } from "@/lib/cn";

/**
 * Substitui o extinto ai_note (0/10 preenchido na Mongo real) —
 * commercial_briefing é o que o backend gera hoje, na forma v2 (ver
 * lib/derive/briefing.ts). O realce cruzado texto ↔ bullets de evidência
 * desapareceu com o schema v1: já não há snapshot de bullets, e os
 * evidence_ids do v2 são etiquetas de origem, mostradas por item.
 */
export function BriefingPanel({ lead }: { lead: Lead }) {
  const model = briefingModel(lead);

  if (!model) {
    return (
      <div className="px-6 py-8 text-sm text-ink-faint">
        Sem briefing comercial gerado para este lead.
      </div>
    );
  }

  // As perguntas da 1ª chamada entram logo a seguir ao ângulo de abordagem
  // — é aí que servem, antes do diagnóstico e das ressalvas. Se essa
  // secção não existir neste lead, ficam no fim.
  const anglePos = model.sections.findIndex((section) => section.key === "approach_angle");
  const cut = anglePos >= 0 ? anglePos + 1 : model.sections.length;

  return (
    <div className="flex flex-col gap-6 px-6 py-5">
      {lead.monitor_reason && (
        <div className="rounded-tile bg-warning-soft px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">
            Motivo de monitorização
          </p>
          <p className="mt-1 text-sm text-ink">{lead.monitor_reason}</p>
        </div>
      )}

      {model.overview && (
        <div className="rounded-tile bg-surface-sunken px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Síntese</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">{model.overview.text}</p>
          <ItemMeta item={model.overview} />
        </div>
      )}

      {model.sections.slice(0, cut).map((section) => (
        <Section key={section.key} section={section} />
      ))}

      <FirstCallSection items={model.questions} />

      {model.sections.slice(cut).map((section) => (
        <Section key={section.key} section={section} />
      ))}
    </div>
  );
}

function Section({ section }: { section: BriefingSection }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        {section.title}
      </p>
      <div className="flex flex-col gap-3">
        {section.items.map((item, i) => (
          <div key={i}>
            <p
              className={cn(
                "text-sm leading-relaxed",
                section.muted ? "text-ink-faint italic" : "text-ink-muted",
              )}
            >
              {item.text}
            </p>
            <ItemMeta item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Confiança + origens de um item, em chips discretos por baixo do texto. */
function ItemMeta({ item }: { item: BriefingItem | BriefingQuestion }) {
  const confidence = "confidence" in item ? confidenceLabel(item.confidence) : null;
  const sources = item.evidence_ids ?? [];
  if (!confidence && sources.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {confidence && (
        <span className="rounded-pill bg-surface-sunken px-2 py-0.5 text-[10px] font-medium text-ink-faint">
          {confidence}
        </span>
      )}
      {sources.map((id) => (
        <span key={id} className="text-[10px] text-ink-faint">
          · {evidenceSourceLabel(id)}
        </span>
      ))}
    </div>
  );
}

function FirstCallSection({ items }: { items: BriefingQuestion[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        Perguntas para a primeira chamada
      </p>
      <div className="flex flex-col gap-2.5">
        {items.map((item, i) => (
          <div key={i} className="rounded-tile bg-surface-sunken px-3 py-2.5">
            <p className="text-sm font-medium text-ink">{item.question}</p>
            {item.purpose && <p className="mt-0.5 text-xs text-ink-faint">{item.purpose}</p>}
            <ItemMeta item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
