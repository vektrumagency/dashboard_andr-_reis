import { Lead } from "../types";
import { CommercialBullet, InterpretationItem, FirstCallQuestion } from "../types/analysis";
import { Polarity, polarityTone } from "../tone";

/**
 * Transforma o commercial_briefing bruto num modelo pronto para o painel
 * "Comercial" do card. Substitui o ai_note extinto (0/10 preenchido) —
 * ver lib/types.ts. Devolve null quando não há briefing, para a secção
 * inteira desaparecer em vez de mostrar títulos vazios.
 */

const BULLET_CODE_LABELS: Record<string, string> = {
  below_market: "Abaixo do mercado",
  above_market: "Acima do mercado",
  missing_expected_features: "Faltam atributos esperados",
  benchmark_credited_amenities: "Comodidades já creditadas na referência",
  missing_floor_plan: "Sem planta",
  visible_condition_risks: "Riscos de condição visíveis",
  virtual_staging: "Possível home staging virtual",
  probable_occupancy: "Provável ocupação",
  probable_vacancy: "Provável desocupação",
  benchmark_limited: "Referência de mercado limitada",
};

const CATEGORY_LABELS: Record<string, string> = {
  pricing: "Preço",
  amenity: "Comodidades",
  presentation: "Apresentação",
  risk: "Risco",
  visual: "Visual",
};

export function bulletCodeLabel(code: string): string {
  return BULLET_CODE_LABELS[code] ?? code;
}

export function categoryLabel(category: string | null | undefined): string {
  if (!category) return "Outros";
  return CATEGORY_LABELS[category] ?? category;
}

export function bulletTone(bullet: CommercialBullet) {
  return polarityTone((bullet.polarity as Polarity) ?? "neutral");
}

export interface BulletGroup {
  category: string;
  categoryLabel: string;
  bullets: CommercialBullet[];
}

/** Agrupa os bullets do snapshot por categoria, preservando a ordem de chegada. */
export function groupBulletsByCategory(bullets: CommercialBullet[]): BulletGroup[] {
  const order: string[] = [];
  const byCategory = new Map<string, CommercialBullet[]>();
  for (const bullet of bullets) {
    const key = bullet.category ?? "outros";
    if (!byCategory.has(key)) {
      byCategory.set(key, []);
      order.push(key);
    }
    byCategory.get(key)!.push(bullet);
  }
  return order.map((category) => ({
    category,
    categoryLabel: categoryLabel(category),
    bullets: byCategory.get(category)!,
  }));
}

export interface BriefingModel {
  bullets: CommercialBullet[];
  bulletGroups: BulletGroup[];
  whyGoodLead: InterpretationItem[];
  ownerReading: InterpretationItem[];
  commercialMeaning: InterpretationItem[];
  approachAngle: InterpretationItem[];
  firstCallQuestions: FirstCallQuestion[];
  interpretiveUncertainties: InterpretationItem[];
  /** code do bullet → índices em `bullets`, para o realce cruzado por snapshot_bullet_ids. */
  bulletIndexByCode: Map<string, number[]>;
  generatedAt: string | null;
}

function nonEmpty<T>(list: T[] | undefined): T[] {
  return list && list.length > 0 ? list : [];
}

export function briefingModel(lead: Lead): BriefingModel | null {
  const briefing = lead.commercial_briefing;
  if (!briefing) return null;

  const bullets = nonEmpty(briefing.commercial_snapshot?.bullets ?? undefined);
  const interpretation = briefing.interpretation;

  const whyGoodLead = nonEmpty(interpretation?.why_good_lead);
  const ownerReading = nonEmpty(interpretation?.owner_reading);
  const commercialMeaning = nonEmpty(interpretation?.commercial_meaning);
  const approachAngle = nonEmpty(interpretation?.approach_angle);
  const firstCallQuestions = nonEmpty(interpretation?.first_call_questions);
  const interpretiveUncertainties = nonEmpty(interpretation?.interpretive_uncertainties);

  // Sem nenhum conteúdo real, tratar como ausente — mesmo que o objecto exista.
  if (
    bullets.length === 0 &&
    whyGoodLead.length === 0 &&
    ownerReading.length === 0 &&
    commercialMeaning.length === 0 &&
    approachAngle.length === 0 &&
    firstCallQuestions.length === 0 &&
    interpretiveUncertainties.length === 0
  ) {
    return null;
  }

  const bulletIndexByCode = new Map<string, number[]>();
  bullets.forEach((bullet, index) => {
    const list = bulletIndexByCode.get(bullet.code) ?? [];
    list.push(index);
    bulletIndexByCode.set(bullet.code, list);
  });

  return {
    bullets,
    bulletGroups: groupBulletsByCategory(bullets),
    whyGoodLead,
    ownerReading,
    commercialMeaning,
    approachAngle,
    firstCallQuestions,
    interpretiveUncertainties,
    bulletIndexByCode,
    generatedAt: briefing.generated_at ?? null,
  };
}

/** Resolve snapshot_bullet_ids (códigos) para os índices dos bullets de origem, ignorando referências mortas. */
export function resolveBulletRefs(model: BriefingModel, ids: string[] | undefined): number[] {
  if (!ids || ids.length === 0) return [];
  const seen = new Set<number>();
  for (const id of ids) {
    for (const index of model.bulletIndexByCode.get(id) ?? []) {
      seen.add(index);
    }
  }
  return Array.from(seen);
}
