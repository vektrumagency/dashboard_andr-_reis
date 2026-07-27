import { Lead } from "../types";
import { ImageOrigin } from "../types/analysis";

/**
 * Junta property.image_urls com visual_authenticity_shadow.image_assessments
 * (por gallery_number) e com property_intelligence.floor_plan.source_images,
 * devolvendo uma lista pronta para a galeria hero do card.
 *
 * ⚠️ Assunção a confirmar com o Luís: `gallery_number` e `source_images` são
 * 1-based sobre `image_urls` tal como armazenado. No lead de exemplo os
 * valores (2,4,6,10,11,15,19,20,21,28) são consistentes com isso numa
 * galeria de 29, mas não é prova. Se estiver errado, os badges "render"
 * ficam na foto errada — pior do que não os ter — por isso ver
 * `isReliableIndex` abaixo: quando a contagem de avaliações não bate
 * certo com o número de imagens, os badges por foto são todos omitidos e
 * fica apenas o aviso ao nível da galeria.
 */

export interface GalleryImage {
  url: string;
  /** Índice 0-based no array property.image_urls — usar para navegação. */
  index: number;
  origin: ImageOrigin | null;
  confidence: number | null;
  anomalies: string[];
  isFloorPlan: boolean;
  dead?: boolean;
}

function galleryNumberToIndex(galleryNumber: number): number {
  return galleryNumber - 1;
}

export function buildGallery(lead: Lead): GalleryImage[] {
  const urls = lead.property.images ?? [];
  const assessments = lead.visual_authenticity_shadow?.image_assessments ?? [];
  const floorPlanNumbers = new Set(
    lead.property_intelligence?.floor_plan?.source_images ?? [],
  );

  // Se a contagem de avaliações não bate com a galeria, o mapeamento por
  // índice já não é de confiança — mostrar as fotos sem badge em vez de
  // arriscar apontar "render" para a foto errada.
  const reliableIndex = assessments.length > 0 && assessments.length <= urls.length;

  const byIndex = new Map<number, (typeof assessments)[number]>();
  if (reliableIndex) {
    for (const assessment of assessments) {
      byIndex.set(galleryNumberToIndex(assessment.gallery_number), assessment);
    }
  }

  return urls.map((url, index) => {
    const assessment = byIndex.get(index);
    return {
      url,
      index,
      origin: assessment?.image_origin ?? null,
      confidence: assessment?.confidence ?? null,
      anomalies: assessment?.anomalies ?? [],
      isFloorPlan: floorPlanNumbers.has(index + 1),
    };
  });
}

export function floorPlanIndices(lead: Lead): number[] {
  const urls = lead.property.images ?? [];
  const numbers = lead.property_intelligence?.floor_plan?.source_images ?? [];
  return numbers.map((n) => n - 1).filter((i) => i >= 0 && i < urls.length);
}

/**
 * Sinal de "esta galeria pode conter renders". Preferimos o booleano do
 * backend quando existe, mas na prática ele fica `null` mesmo em leads
 * onde a maioria das fotos avaliadas É render (confirmado num lead real:
 * gallery_assessment.likely_contains_ai_modified_images === null com 9/10
 * imagens marcadas image_origin "render" em image_assessments) — sem este
 * fallback, o aviso "estas fotos são renders" nunca aparece nesse lead,
 * que é exactamente o caso que André mais precisa de ver.
 *
 * Na vista de lista (getLeadsList) `image_assessments` não existe — ver
 * LIST_PROJECTION em lib/api.ts — pelo que aí a função cai sempre para o
 * booleano do backend (ou `false`). No documento completo (getLead),
 * conta directamente a proporção de renders entre as imagens avaliadas.
 */
export function likelyContainsRenders(lead: Lead): boolean {
  const flag = lead.visual_authenticity_shadow?.gallery_assessment?.likely_contains_ai_modified_images;
  if (flag === true) return true;

  const assessments = lead.visual_authenticity_shadow?.image_assessments ?? [];
  if (assessments.length === 0) return false;
  const renders = assessments.filter((a) => a.image_origin === "render").length;
  return renders / assessments.length >= 0.5;
}

export interface ExpiryInfo {
  expired: boolean;
  expiresAt: Date | null;
}

/**
 * Os URLs do Idealista são assinados com `Expires=<epoch em segundos>`.
 * Passa a validade a claro em vez de deixar 38-110 pedidos falharem em
 * silêncio quando um lead envelhece.
 */
export function imageUrlExpiry(url: string): ExpiryInfo {
  try {
    const parsed = new URL(url);
    const raw = parsed.searchParams.get("Expires");
    if (!raw) return { expired: false, expiresAt: null };
    const seconds = Number(raw);
    if (!Number.isFinite(seconds)) return { expired: false, expiresAt: null };
    const expiresAt = new Date(seconds * 1000);
    return { expired: expiresAt.getTime() < Date.now(), expiresAt };
  } catch {
    return { expired: false, expiresAt: null };
  }
}
