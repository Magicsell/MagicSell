import { MongoClient, ServerApiVersion } from 'mongodb';

let client; // global cache
export default async function handler(req, res) {
  res.setHeader('Content-Type','application/json');
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) return res.status(500).json({ ok:false, error:'MONGODB_URI missing' });

    client ||= new MongoClient(uri, {
      serverApi: { version: ServerApiVersion.v1, strict: false, deprecationErrors: false },
      maxIdleTimeMS: 60_000, serverSelectionTimeoutMS: 5_000
    });

    const conn = await client.connect();
    const db = conn.db(process.env.DB_NAME || undefined);
    const n = await db.collection('orders').countDocuments();

    return res.status(200).json({ ok:true, db: db.databaseName, orders: n });
  } catch (e) {
    return res.status(500).json({ ok:false, name: e.name, message: e.message, code: e.code });
  }
}
