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
  latitude?: number | null;
  longitude?: number | null;
};

type RawLead = Omit<Lead, "id" | "property"> & { _id: ObjectId; property: RawProperty };

function normalizeLead(raw: RawLead): Lead {
  return {
    ...raw,
    id: raw._id.toString(),
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
 * cache() dedupe pedidos dentro do mesmo request/render — evita 3 chamadas
 * à base de dados (layout + página do lead + modal interceptado) por navegação.
 */
export const getLeads = cache(async (): Promise<Lead[]> => {
  const db = await getDb();
  const raw = await db.collection<RawLead>(LEADS_COLLECTION).find().toArray();
  return raw.map(normalizeLead);
});

export async function updateLeadStatus(id: string, status: Lead["status"]): Promise<Lead> {
  const db = await getDb();
  const result = await db.collection<RawLead>(LEADS_COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status, updated_at: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  if (!result) {
    throw new Error(`Lead ${id} não encontrado.`);
  }
  return normalizeLead(result);
}
