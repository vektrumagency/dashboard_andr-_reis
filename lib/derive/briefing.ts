import { Lead } from "../types";
import {
  BriefingItem,
  BriefingQuestion,
  BriefingV2,
  InterpretationItem,
} from "../types/analysis";

/**
 * Transforma o commercial_briefing bruto num modelo pronto para o painel
 * "Comercial" do card. Substitui o ai_note extinto (0/10 preenchido) —
 * ver lib/types.ts. Devolve null quando não há briefing, para a secção
 * inteira desaparecer em vez de mostrar títulos vazios.
 *
 * Duas gerações de schema:
 *
 * - **v2** (`commercial_briefing.briefing`) — o que o backend gera hoje.
 *   Confirmado contra a Mongo real em 2026-08-10: 60/60 documentos em
 *   `schema_version 2.0` / `status: generated`, todos com as dez chaves.
 * - **v1** (`commercial_snapshot` + `interpretation`) — `null` em toda a
 *   BD atual, mas documentos antigos podem reaparecer (re-import, backup),
 *   por isso continua a ser lido e mapeado para o MESMO modelo de secções.
 *   Assim o painel tem um único caminho de rendering.
 *
 * Foi esta migração que fez o separador Comercial mostrar sempre "Sem
 * briefing comercial gerado": o conteúdo estava lá, noutro caminho.
 */

const EVIDENCE_SOURCE_LABELS: Record<string, string> = {
  "listing.property": "Anúncio",
  "market.benchmark": "Referência de mercado",
  "visual.assessment": "Análise visual",
  "visual.authenticity": "Autenticidade das imagens",
  "property.intelligence": "Análise do imóvel",
  "location.intelligence": "Localização",
};

/** Etiqueta legível da origem de um item; cai no id em bruto se o backend introduzir uma nova. */
export function evidenceSourceLabel(id: string): string {
  return EVIDENCE_SOURCE_LABELS[id] ?? id;
}

export interface BriefingSection {
  key: string;
  title: string;
  items: BriefingItem[];
  /** Renderizada em tom apagado — usado nas incertezas. */
  muted?: boolean;
}

export interface BriefingModel {
  /** Parágrafo de síntese, lido primeiro. */
  overview: BriefingItem | null;
  /** Já ordenadas por utilidade comercial e sem as vazias. */
  sections: BriefingSection[];
  questions: BriefingQuestion[];
  generatedAt: string | null;
}

/**
 * Ordem de leitura no card: primeiro o que decide se vale a pena ligar,
 * depois o material da chamada, e só no fim o diagnóstico e as ressalvas.
 */
const SECTION_ORDER: { key: keyof BriefingV2; title: string; muted?: boolean }[] = [
  { key: "commercial_relevance", title: "Porque é um bom lead" },
  { key: "strengths", title: "Pontos fortes" },
  { key: "approach_angle", title: "Ângulo de abordagem" },
  { key: "owner_situations", title: "Leitura do proprietário" },
  { key: "recommended_positioning", title: "Posicionamento recomendado" },
  { key: "property_market_diagnosis", title: "Diagnóstico de mercado" },
  { key: "risks_and_presentation", title: "Riscos e apresentação" },
  { key: "uncertainties", title: "Incertezas", muted: true },
];

function nonEmpty<T>(list: T[] | null | undefined): T[] {
  return list && list.length > 0 ? list : [];
}

/** Os itens v1 têm a mesma forma útil dos v2, tirando o nome do campo de origens. */
function fromV1(items: InterpretationItem[] | undefined): BriefingItem[] {
  return nonEmpty(items).map((item) => ({
    text: item.text,
    confidence: item.confidence ?? null,
    evidence_ids: item.snapshot_bullet_ids,
    category: item.category ?? null,
  }));
}

function modelFromV2(briefing: BriefingV2): Omit<BriefingModel, "generatedAt"> {
  const sections: BriefingSection[] = [];
  for (const { key, title, muted } of SECTION_ORDER) {
    const items = nonEmpty(briefing[key] as BriefingItem[] | undefined);
    if (items.length > 0) sections.push({ key, title, items, muted });
  }
  const overview = briefing.commercial_overview;
  return {
    overview: overview?.text ? overview : null,
    sections,
    questions: nonEmpty(briefing.first_call_questions),
  };
}

function modelFromV1(
  interpretation: NonNullable<NonNullable<Lead["commercial_briefing"]>["interpretation"]>,
): Omit<BriefingModel, "generatedAt"> {
  // Mapeia os campos v1 para os títulos equivalentes do v2 — o painel não
  // precisa de saber de que geração veio o documento.
  const v1Sections: { key: string; title: string; items: BriefingItem[]; muted?: boolean }[] = [
    { key: "why_good_lead", title: "Porque é um bom lead", items: fromV1(interpretation.why_good_lead) },
    { key: "approach_angle", title: "Ângulo de abordagem", items: fromV1(interpretation.approach_angle) },
    { key: "owner_reading", title: "Leitura do proprietário", items: fromV1(interpretation.owner_reading) },
    { key: "commercial_meaning", title: "Significado comercial", items: fromV1(interpretation.commercial_meaning) },
    {
      key: "interpretive_uncertainties",
      title: "Incertezas",
      items: fromV1(interpretation.interpretive_uncertainties),
      muted: true,
    },
  ];
  return {
    overview: null,
    sections: v1Sections.filter((section) => section.items.length > 0),
    questions: nonEmpty(interpretation.first_call_questions),
  };
}

export function briefingModel(lead: Lead): BriefingModel | null {
  const briefing = lead.commercial_briefing;
  if (!briefing) return null;

  const base = briefing.briefing
    ? modelFromV2(briefing.briefing)
    : briefing.interpretation
      ? modelFromV1(briefing.interpretation)
      : null;

  // Sem nenhum conteúdo real, tratar como ausente — mesmo que o objecto
  // exista (é o caso de um briefing com status failed/pending).
  if (!base || (!base.overview && base.sections.length === 0 && base.questions.length === 0)) {
    return null;
  }

  return { ...base, generatedAt: briefing.generated_at ?? null };
}
