import { cache } from "react";
import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { Lead } from "./types";

const LEADS_COLLECTION = "leads";

/**
 * O documento na Mongo usa _id (ObjectId), image_urls e latitude/longitude
 * em vez de id, images e lat/lng. furnished não existe no backend do
 * Luís — normalizamos aqui para o resto da app não ter de saber da forma
 * exata do documento.
 */
type RawProperty = Omit<Lead["property"], "images" | "furnished" | "lat" | "lng"> & {
  image_urls?: string[];
  /** Só presente na vista de lista (getLeadsList) — ver PIPELINE abaixo. */
  image_count?: number;
  latitude?: number | null;
  longitude?: number | null;
};

type RawLead = Omit<Lead, "id" | "property"> & { _id: ObjectId; property: RawProperty };

function normalizeLead(raw: RawLead): Lead {
  // `_id` tem de ser desestruturado para fora do spread, não só sobreposto
  // por `id` — de outro modo o ObjectId em bruto (com o seu buffer interno
  // e um toJSON próprio) continua no objeto final e é passado a Client
  // Components, onde o serializer do React o rejeita: "Only plain objects
  // can be passed to Client Components... Objects with toJSON methods are
  // not supported." Confirmado no console em 2026-07-27.
  const { _id, ...rest } = raw;
  return {
    ...rest,
    id: _id.toString(),
    property: {
      ...raw.property,
      furnished: null,
      lat: raw.property.latitude ?? null,
      lng: raw.property.longitude ?? null,
      images: raw.property.image_urls ?? [],
    },
  };
}

/**
 * Excluídos da vista de lista: os blocos de análise mais pesados
 * (evidência extensa, arrays de ajustamento, planta detalhada) mais o
 * grosso da galeria de imagens — nada disto é lido pela tabela, pela
 * sidebar, por /atacar ou por /localizar, mas engordava o payload
 * enviado ao cliente em CADA navegação (app/layout.tsx despacha a lista
 * inteira para o LeadsProvider). O detalhe do lead usa getLead(id), que
 * não tem esta projeção — lê o documento completo.
 *
 * Todos os campos aqui excluídos são opcionais em lib/types.ts, por isso
 * um documento sem eles continua a satisfazer o tipo `Lead` — não é
 * preciso um tipo "LeadListItem" à parte.
 *
 * `visual_authenticity_shadow` mantém-se, mas sem `image_assessments`
 * (um array por foto — é o que pesa) nem `shadow_filtered_visual_assessment`
 * (duplica visual_assessment): a tabela só precisa do resumo em
 * `gallery_assessment.likely_contains_ai_modified_images` para o badge
 * "possíveis renders" na miniatura, não da avaliação foto a foto.
 *
 * Verificado directamente contra a Mongo real (2026-07-27): uma projeção
 * de exclusão compõe com `$slice` num campo irmão sem erro, e
 * property_intelligence/location_intelligence são irmãos de `property`
 * no documento, não campos aninhados dentro dele.
 */
/**
 * Pipeline em 3 estágios porque `$project` não deixa misturar uma
 * expressão (`$slice` como agregação) com exclusão de outros campos no
 * mesmo estágio — confirmado directamente contra a Mongo real
 * (2026-07-27): "Cannot use expression other than $meta in exclusion
 * projection". Por isso o `$slice` que reduz a galeria a 1 foto vive no
 * seu próprio `$addFields`, separado da exclusão dos blocos pesados.
 */
const LIST_PIPELINE = [
  { $addFields: { "property.image_count": { $size: { $ifNull: ["$property.image_urls", []] } } } },
  { $addFields: { "property.image_urls": { $slice: ["$property.image_urls", 1] } } },
  {
    $project: {
      commercial_briefing: 0,
      "visual_authenticity_shadow.image_assessments": 0,
      "visual_authenticity_shadow.shadow_filtered_visual_assessment": 0,
      research_meta: 0,
      property_identity: 0,
      location_intelligence: 0,
      "property_intelligence.evidence": 0,
      "property_intelligence.floor_plan": 0,
      "property.market_reference_adjustments": 0,
      "property.market_amenity_adjustments": 0,
      "property.market_reference_qualitative_factors": 0,
    },
  },
] as const;

/**
 * Vista de lista (tabela, sidebar, /atacar, /localizar, /mapa) — projetada
 * para não pagar o custo dos blocos de análise pesados nem das galerias
 * inteiras em superfícies que nunca os leem. cache() dedupe pedidos
 * dentro do mesmo request/render.
 */
export const getLeadsList = cache(async (): Promise<Lead[]> => {
  const db = await getDb();
  const raw = await db
    .collection<RawLead>(LEADS_COLLECTION)
    .aggregate<RawLead>([...LIST_PIPELINE])
    .toArray();
  return raw.map(normalizeLead);
});

/** Documento completo, para a rota de detalhe — sem projeção. */
export const getLead = cache(async (id: string): Promise<Lead | null> => {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const raw = await db.collection<RawLead>(LEADS_COLLECTION).findOne({ _id: new ObjectId(id) });
  return raw ? normalizeLead(raw) : null;
});

export async function updateLeadStatus(id: string, status: Lead["status"]): Promise<Lead> {
  const db = await getDb();
  const result = await db.collection<RawLead>(LEADS_COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status, updated_at: new Date().toISOString() } },
    { returnDocument: "after" },
  );
  if (!result) {
    throw new Error(`Lead ${id} não encontrado.`);
  }
  return normalizeLead(result);
}
