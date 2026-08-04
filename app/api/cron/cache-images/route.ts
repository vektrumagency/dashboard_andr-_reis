import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { put } from "@vercel/blob";
import { getDb } from "@/lib/mongodb";

const LEADS_COLLECTION = "leads";
/** Própria do dashboard — ver lib/api.ts para o join com a leitura dos leads. */
const IMAGE_CACHE_COLLECTION = "image_cache";

interface RawLeadImages {
  _id: ObjectId;
  property?: { image_urls?: string[] };
}

interface ImageCacheDoc {
  leadId: string;
  index: number;
  blobUrl: string;
  cachedAt: string;
}

// Percorrer todos os leads e descarregar imagens novas pode demorar mais
// que os 10s por omissão do Fluid Compute.
export const maxDuration = 300;

/**
 * Descarrega as fotos do Idealista (URLs assinados, com expiração) enquanto
 * ainda são válidas e guarda-as no Vercel Blob (duradouro). Corre em
 * intervalo via Vercel Cron — ver vercel.json. Idempotente: salta qualquer
 * (leadId, index) já presente em image_cache.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const db = await getDb();
  const leads = await db
    .collection<RawLeadImages>(LEADS_COLLECTION)
    .find({}, { projection: { "property.image_urls": 1 } })
    .toArray();

  const cacheCollection = db.collection<ImageCacheDoc>(IMAGE_CACHE_COLLECTION);
  const already = await cacheCollection
    .find({}, { projection: { leadId: 1, index: 1, _id: 0 } })
    .toArray();
  const cachedKeys = new Set(already.map((doc) => `${doc.leadId}:${doc.index}`));

  let cached = 0;
  let skipped = 0;
  let failed = 0;

  for (const lead of leads) {
    const leadId = lead._id.toString();
    const urls = lead.property?.image_urls ?? [];

    for (let index = 0; index < urls.length; index++) {
      if (cachedKeys.has(`${leadId}:${index}`)) {
        skipped++;
        continue;
      }

      try {
        const response = await fetch(urls[index]);
        if (!response.ok) {
          failed++;
          continue;
        }
        const bytes = await response.arrayBuffer();
        const blob = await put(`idealista/${leadId}/${index}.jpg`, Buffer.from(bytes), {
          access: "public",
          addRandomSuffix: false,
          allowOverwrite: true,
        });
        await cacheCollection.insertOne({
          leadId,
          index,
          blobUrl: blob.url,
          cachedAt: new Date().toISOString(),
        });
        cached++;
      } catch (error) {
        console.error(`Falha ao cachear imagem ${leadId}:${index}`, error);
        failed++;
      }
    }
  }

  return NextResponse.json({ cached, skipped, failed });
}
