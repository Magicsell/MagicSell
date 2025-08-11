const { MongoClient, ServerApiVersion } = require('mongodb');
let client;
module.exports = async (req, res) => {
  res.setHeader('Content-Type','application/json');
  try {
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({ ok:false, error:'MONGODB_URI missing' });
    }
    client ||= new MongoClient(process.env.MONGODB_URI, {
      serverApi: { version: ServerApiVersion.v1 },
      serverSelectionTimeoutMS: 5000,
      maxIdleTimeMS: 60000
    });
    const conn = await client.connect();
    const db = conn.db(process.env.DB_NAME || undefined);
    const n = await db.collection('orders').countDocuments();
    res.status(200).json({ ok:true, db: db.databaseName, orders: n });
  } catch (e) {
    res.status(500).json({ ok:false, name: e.name, message: e.message, code: e.code });
  }
};
