"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Lead } from "@/lib/types";
import { CommercialBullet, FirstCallQuestion, InterpretationItem } from "@/lib/types/analysis";
import { briefingModel, bulletCodeLabel, bulletTone, resolveBulletRefs } from "@/lib/derive/briefing";
import { cn } from "@/lib/cn";

/**
 * Substitui o extinto ai_note (0/10 preenchido na Mongo real) —
 * commercial_briefing é o que o backend gera hoje. Passar o rato (ou
 * tocar, em mobile) numa leitura realça os bullets de evidência de onde
 * ela vem, via snapshot_bullet_ids — ver lib/derive/briefing.ts.
 */
export function BriefingPanel({ lead }: { lead: Lead }) {
  const model = briefingModel(lead);
  const [highlighted, setHighlighted] = useState<Set<number>>(new Set());
  const [bulletsOpen, setBulletsOpen] = useState(false);

  if (!model) {
    return (
      <div className="px-6 py-8 text-sm text-ink-faint">
        Sem briefing comercial gerado para este lead.
      </div>
    );
  }

  // Arrow function const, não `function` — a narrowing de `model` (feita
  // acima) só se preserva numa closure se a função não for hoisted.
  const highlight = (ids: string[] | undefined) => {
    setHighlighted(new Set(resolveBulletRefs(model, ids)));
    if (ids && ids.length > 0) setBulletsOpen(true);
  };

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

      <InterpretationSection
        title="Porque é um bom lead"
        items={model.whyGoodLead}
        onHover={highlight}
      />
      <InterpretationSection
        title="Ângulo de abordagem"
        items={model.approachAngle}
        onHover={highlight}
      />
      <FirstCallSection items={model.firstCallQuestions} onHover={highlight} />
      <InterpretationSection
        title="Leitura do proprietário"
        items={model.ownerReading}
        onHover={highlight}
      />
      <InterpretationSection
        title="Significado comercial"
        items={model.commercialMeaning}
        onHover={highlight}
      />
      <InterpretationSection
        title="Incertezas de interpretação"
        items={model.interpretiveUncertainties}
        onHover={highlight}
        muted
      />

      <div className="border-t border-line pt-4">
        <button
          type="button"
          onClick={() => setBulletsOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted hover:text-ink"
        >
          <ChevronDown size={14} className={`transition-transform ${bulletsOpen ? "rotate-0" : "-rotate-90"}`} />
          Evidência ({model.bullets.length})
        </button>
        {bulletsOpen && (
          <div className="mt-3 flex flex-col gap-3">
            {model.bulletGroups.map((group) => (
              <div key={group.category}>
                <p className="mb-1.5 text-[10px] uppercase tracking-wide text-ink-faint">
                  {group.categoryLabel}
                </p>
                <div className="flex flex-col gap-1.5">
                  {group.bullets.map((bullet) => (
                    <BulletRow
                      key={`${bullet.code}-${bullet.text.slice(0, 12)}`}
                      bullet={bullet}
                      highlighted={highlighted.has(model.bullets.indexOf(bullet))}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InterpretationSection({
  title,
  items,
  onHover,
  muted,
}: {
  title: string;
  items: InterpretationItem[];
  onHover: (ids: string[] | undefined) => void;
  muted?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{title}</p>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <p
            key={i}
            onMouseEnter={() => onHover(item.snapshot_bullet_ids)}
            onMouseLeave={() => onHover(undefined)}
            className={cn(
              "cursor-default text-sm leading-relaxed",
              muted ? "text-ink-faint italic" : "text-ink-muted",
            )}
          >
            {item.text}
          </p>
        ))}
      </div>
    </div>
  );
}

function FirstCallSection({
  items,
  onHover,
}: {
  items: FirstCallQuestion[];
  onHover: (ids: string[] | undefined) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        Perguntas para a primeira chamada
      </p>
      <div className="flex flex-col gap-2.5">
        {items.map((item, i) => (
          <div
            key={i}
            onMouseEnter={() => onHover(item.snapshot_bullet_ids)}
            onMouseLeave={() => onHover(undefined)}
            className="rounded-tile bg-surface-sunken px-3 py-2.5"
          >
            <p className="text-sm font-medium text-ink">{item.question}</p>
            {item.purpose && <p className="mt-0.5 text-xs text-ink-faint">{item.purpose}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function BulletRow({ bullet, highlighted }: { bullet: CommercialBullet; highlighted: boolean }) {
  const tone = bulletTone(bullet);
  return (
    <div
      className={cn(
        "rounded-tile px-3 py-2 text-xs transition-colors",
        highlighted ? cn(tone.chip, "ring-1 ring-inset ring-current") : "bg-surface-sunken text-ink-muted",
      )}
    >
      <p className="font-medium">{bulletCodeLabel(bullet.code)}</p>
      <p className="mt-0.5 opacity-90">{bullet.text}</p>
    </div>
  );
}
