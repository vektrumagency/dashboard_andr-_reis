import { MongoClient, Db } from "mongodb";

/**
 * Guardamos o client numa global em dev para o hot-reload do Next.js não
 * abrir uma ligação nova a cada guardar de ficheiro.
 */
const globalForMongo = global as unknown as { mongoClientPromise?: Promise<MongoClient> };

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI não está definida.");
  }

  if (!globalForMongo.mongoClientPromise) {
    const promise = new MongoClient(uri).connect();
    // Se a ligação falhar, limpamos a cache — caso contrário a promise
    // rejeitada fica presa nesta instância do processo (dev hot-reload ou
    // instância "quente" do Fluid Compute) e nunca mais tenta de novo.
    promise.catch(() => {
      globalForMongo.mongoClientPromise = undefined;
    });
    globalForMongo.mongoClientPromise = promise;
  }
  return globalForMongo.mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const dbName = process.env.MONGODB_DB_NAME;
  if (!dbName) {
    throw new Error("MONGODB_DB_NAME não está definida.");
  }
  const client = await getClientPromise();
  return client.db(dbName);
}
