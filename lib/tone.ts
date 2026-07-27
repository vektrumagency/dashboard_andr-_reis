import { LeadPriority, LeadStatus } from "./types";
import { PRIORITY_LABELS, STATUS_LABELS } from "./leads";

/**
 * Fonte única dos mapas de cor semânticos. Antes desta ficheiro existiam
 * quatro versões independentes e ligeiramente diferentes do mesmo
 * significado (lib/scoreColor.ts, lib/priorityAccent.ts, StatusBadge.tsx,
 * PriorityBadge.tsx, PIN_COLORS em LeadsMap.tsx) — mudar uma cor obrigava a
 * lembrar de mudar as outras três. Os valores hex espelham os tokens
 * definidos em app/globals.css (@theme); mantém os dois em sincronia à mão
 * quando um mudar, porque o Mapbox (LeadsMap.tsx) cria markers via DOM
 * imperativo e não consegue ler var(--color-*) nesse contexto.
 */

export interface Tone {
  /** Classes Tailwind para texto/fundo/borda, usar conforme o contexto. */
  text: string;
  bg: string;
  border: string;
  /** Fundo suave (soft) + texto, para badges/chips. */
  chip: string;
  /** Valor cru, para contextos que não aceitam classes CSS (ex: Mapbox). */
  hex: string;
  label: string;
}

/**
 * Prioridade como rampa de intensidade em dourado, não matizes diferentes.
 * Antes "high" era vermelho (lib/priorityAccent.ts), o que colidia com o
 * vermelho de polaridade negativa — um lead BOM ficava com a cor de MAU.
 * Dourado preenchido/contorno/esbatido deixa o vermelho livre para
 * significar sempre "risco".
 */
const PRIORITY_TONES: Record<LeadPriority, Tone> = {
  high: {
    text: "text-gold",
    bg: "bg-gold",
    border: "border-gold",
    chip: "bg-gold text-canvas",
    hex: "#d8b46a",
    label: PRIORITY_LABELS.high,
  },
  medium: {
    text: "text-gold",
    bg: "bg-gold-soft",
    border: "border-gold",
    chip: "border border-gold text-gold bg-transparent",
    hex: "#c99a3f",
    label: PRIORITY_LABELS.medium,
  },
  low: {
    text: "text-ink-muted",
    bg: "bg-surface-raised",
    border: "border-line-strong",
    chip: "bg-surface-raised text-ink-muted",
    hex: "#71717a",
    label: PRIORITY_LABELS.low,
  },
  exclude: {
    text: "text-ink-faint",
    bg: "bg-surface-sunken",
    border: "border-line",
    chip: "bg-surface-sunken text-ink-faint",
    hex: "#45454d",
    label: PRIORITY_LABELS.exclude,
  },
};

export function priorityTone(priority: LeadPriority): Tone {
  return PRIORITY_TONES[priority] ?? PRIORITY_TONES.low;
}

const STATUS_TONES: Record<LeadStatus, Tone> = {
  new: {
    text: "text-status-new",
    bg: "bg-status-new",
    border: "border-status-new",
    chip: "bg-status-new/15 text-status-new",
    hex: "#60a5fa",
    label: STATUS_LABELS.new,
  },
  saved: {
    text: "text-status-saved",
    bg: "bg-status-saved",
    border: "border-status-saved",
    chip: "bg-status-saved/15 text-status-saved",
    hex: "#34d399",
    label: STATUS_LABELS.saved,
  },
  contacted: {
    text: "text-status-contacted",
    bg: "bg-status-contacted",
    border: "border-status-contacted",
    chip: "bg-status-contacted/15 text-status-contacted",
    hex: "#a78bfa",
    label: STATUS_LABELS.contacted,
  },
  visit: {
    text: "text-status-visit",
    bg: "bg-status-visit",
    border: "border-status-visit",
    chip: "bg-status-visit/15 text-status-visit",
    hex: "#fb923c",
    label: STATUS_LABELS.visit,
  },
  locating: {
    text: "text-status-locating",
    bg: "bg-status-locating",
    border: "border-status-locating",
    chip: "bg-status-locating/15 text-status-locating",
    hex: "#22d3ee",
    label: STATUS_LABELS.locating,
  },
  not_relevant: {
    text: "text-status-not_relevant",
    bg: "bg-status-not_relevant",
    border: "border-status-not_relevant",
    chip: "bg-status-not_relevant/15 text-status-not_relevant",
    hex: "#71717a",
    label: STATUS_LABELS.not_relevant,
  },
};

export function statusTone(status: LeadStatus): Tone {
  return STATUS_TONES[status] ?? STATUS_TONES.new;
}

export type Polarity = "positive" | "negative" | "warning" | "neutral";

const POLARITY_TONES: Record<Polarity, Tone> = {
  positive: {
    text: "text-positive",
    bg: "bg-positive",
    border: "border-positive",
    chip: "bg-positive-soft text-positive",
    hex: "#34d399",
    label: "Positivo",
  },
  negative: {
    text: "text-negative",
    bg: "bg-negative",
    border: "border-negative",
    chip: "bg-negative-soft text-negative",
    hex: "#f87171",
    label: "Negativo",
  },
  warning: {
    text: "text-warning",
    bg: "bg-warning",
    border: "border-warning",
    chip: "bg-warning-soft text-warning",
    hex: "#fbbf24",
    label: "Atenção",
  },
  neutral: {
    text: "text-ink-muted",
    bg: "bg-neutral",
    border: "border-line-strong",
    chip: "bg-neutral-soft text-ink-muted",
    hex: "#9a9aa5",
    label: "Neutro",
  },
};

export function polarityTone(polarity: string | null | undefined): Tone {
  return POLARITY_TONES[polarity as Polarity] ?? POLARITY_TONES.neutral;
}

/**
 * Score é 0–10 (confirmado contra a Mongo real), não 0–100. O
 * lib/scoreColor.ts anterior usava limiares de 80/60, pelo que TODOS os
 * leads reais apareciam a vermelho — o bug ficava invisível em mockData
 * porque lá os scores eram inventados na escala errada.
 */
export function scoreTone(score: number): Tone {
  if (score >= 8) return POLARITY_TONES.positive;
  if (score >= 5) return POLARITY_TONES.warning;
  return POLARITY_TONES.negative;
}

const MARKET_POSITION_TONES: Record<string, Tone> = {
  below_market: POLARITY_TONES.positive,
  above_market: POLARITY_TONES.negative,
  around_market: POLARITY_TONES.neutral,
};

export function marketPositionTone(position: string | null | undefined): Tone {
  return (position && MARKET_POSITION_TONES[position]) || POLARITY_TONES.neutral;
}
