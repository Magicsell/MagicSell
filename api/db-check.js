import { MongoClient } from "mongodb";

let client; // global cache

export default async function handler(req, res) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) return res.status(500).json({ ok:false, error:"MONGODB_URI missing" });

    client ||= new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      maxIdleTimeMS: 60000
    });

    const conn = await client.connect();
    const db = conn.db(process.env.DB_NAME || undefined);

    const ping = await db.command({ ping: 1 });
    const orders = await db.collection("orders").countDocuments();

    return res.status(200).json({
      ok: true,
      ping,
      db: db.databaseName,
      orders
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      name: e.name,
      message: e.message,
      code: e.code,
      reason: e.reason
    });
  }
}
