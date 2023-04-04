import { MongoClient } from "mongodb";

let client: MongoClient | null = null;

export async function connect() {
  if (client) return client;

  client = new MongoClient(process.env.MONGO_URL);

  await client.connect();
  console.log("Connected to MongoDB");

  return client;
}

export function getDb() {
  if (!client) throw new Error("Not connected to MongoDB");
  return client.db(process.env.MONGO_DB);
}

export async function close() {
  if (client) {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}
